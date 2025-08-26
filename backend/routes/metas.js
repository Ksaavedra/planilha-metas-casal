const express = require('express');
const Meta = require('../models/Meta');
const router = express.Router();

// GET /metas - Listar todas as metas
router.get('/', async (req, res) => {
   try {
      const metas = await Meta.findAll();

      // Converter valores para números antes de enviar
      const metasConvertidas = metas.map((meta) => ({
         ...meta,
         valorMeta: Number(meta.valorMeta),
         valorPorMes: Number(meta.valorPorMes),
         mesesNecessarios: Number(meta.mesesNecessarios),
         valorAtual: Number(meta.valorAtual),
         meses: meta.meses.map((mes) => ({
            ...mes,
            valor: Number(mes.valor),
         })),
      }));

      res.json(metasConvertidas);
   } catch (error) {
      console.error('Erro ao buscar metas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// GET /metas/:id - Buscar meta por ID
router.get('/:id', async (req, res) => {
   try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: 'ID deve ser numérico' });
      }

      const meta = await Meta.findById(id);
      if (!meta) {
         return res.status(404).json({ error: 'Meta não encontrada' });
      }

      // Converter valores para números antes de enviar
      const metaConvertida = {
         ...meta,
         valorMeta: Number(meta.valorMeta),
         valorPorMes: Number(meta.valorPorMes),
         mesesNecessarios: Number(meta.mesesNecessarios),
         valorAtual: Number(meta.valorAtual),
         meses: meta.meses.map((mes) => ({
            ...mes,
            valor: Number(mes.valor),
         })),
      };

      res.json(metaConvertida);
   } catch (error) {
      console.error('Erro ao buscar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// POST /metas - Criar nova meta
router.post('/', async (req, res) => {
   try {
      const { nome, valorMeta, valorPorMes, valorAtual } = req.body;

      // Validações
      if (!nome || !valorMeta || !valorPorMes) {
         return res.status(400).json({
            error: 'Nome, valor da meta e valor por mês são obrigatórios',
         });
      }

      if (valorMeta <= 0 || valorPorMes <= 0) {
         return res.status(400).json({
            error: 'Valores devem ser maiores que zero',
         });
      }

      // Calcular meses necessários
      const mesesNecessarios = Math.ceil(
         (valorMeta - (valorAtual || 0)) / valorPorMes
      );

      const metaData = {
         nome,
         valorMeta: parseFloat(valorMeta),
         valorPorMes: parseFloat(valorPorMes),
         mesesNecessarios,
         valorAtual: parseFloat(valorAtual || 0),
      };

      const novaMeta = await Meta.create(metaData);
      res.status(201).json(novaMeta);
   } catch (error) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// PATCH /metas/:id - Atualizar meta parcialmente
router.patch('/:id', async (req, res) => {
   try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: 'ID deve ser numérico' });
      }

      const { nome, valorMeta, valorPorMes, valorAtual, mesesNecessarios } =
         req.body;

      // Construir objeto de atualização apenas com campos fornecidos
      const updateData = {};
      if (nome !== undefined) updateData.nome = nome;
      if (valorMeta !== undefined) updateData.valorMeta = parseFloat(valorMeta);
      if (valorPorMes !== undefined)
         updateData.valorPorMes = parseFloat(valorPorMes);
      if (valorAtual !== undefined)
         updateData.valorAtual = parseFloat(valorAtual);
      if (mesesNecessarios !== undefined)
         updateData.mesesNecessarios = parseInt(mesesNecessarios);

      const metaAtualizada = await Meta.update(id, updateData);
      if (!metaAtualizada) {
         return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(metaAtualizada);
   } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// PUT /metas/:id - Atualizar meta
router.put('/:id', async (req, res) => {
   try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: 'ID deve ser numérico' });
      }

      const { nome, valorMeta, valorPorMes, valorAtual } = req.body;

      // Validações
      if (!nome || !valorMeta || !valorPorMes) {
         return res.status(400).json({
            error: 'Nome, valor da meta e valor por mês são obrigatórios',
         });
      }

      if (valorMeta <= 0 || valorPorMes <= 0) {
         return res.status(400).json({
            error: 'Valores devem ser maiores que zero',
         });
      }

      // Calcular meses necessários
      const mesesNecessarios = Math.ceil(
         (valorMeta - (valorAtual || 0)) / valorPorMes
      );

      const metaData = {
         nome,
         valorMeta: parseFloat(valorMeta),
         valorPorMes: parseFloat(valorPorMes),
         mesesNecessarios,
         valorAtual: parseFloat(valorAtual || 0),
      };

      const metaAtualizada = await Meta.update(id, metaData);
      if (!metaAtualizada) {
         return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(metaAtualizada);
   } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// DELETE /metas/:id - Deletar meta
router.delete('/:id', async (req, res) => {
   try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: 'ID deve ser numérico' });
      }

      const deletado = await Meta.delete(id);
      if (!deletado) {
         return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.status(204).send();
   } catch (error) {
      console.error('Erro ao deletar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// PUT /metas/:id/meses/:mesId - Atualizar valor de um mês
router.put('/:id/meses/:mesId', async (req, res) => {
   try {
      const metaId = parseInt(req.params.id);
      const mesId = parseInt(req.params.mesId);
      const { valor } = req.body;

      if (isNaN(metaId) || isNaN(mesId)) {
         return res.status(400).json({ error: 'IDs devem ser numéricos' });
      }

      if (valor < 0) {
         return res.status(400).json({ error: 'Valor não pode ser negativo' });
      }

      const metaAtualizada = await Meta.updateMes(
         metaId,
         mesId,
         parseFloat(valor)
      );
      if (!metaAtualizada) {
         return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(metaAtualizada);
   } catch (error) {
      console.error('Erro ao atualizar mês:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// PUT /metas/:id/meses/:mesId/status - Atualizar status de um mês
router.put('/:id/meses/:mesId/status', async (req, res) => {
   try {
      const metaId = parseInt(req.params.id);
      const mesId = parseInt(req.params.mesId);
      const { status } = req.body;

      if (isNaN(metaId) || isNaN(mesId)) {
         return res.status(400).json({ error: 'IDs devem ser numéricos' });
      }

      if (!['Vazio', 'Programado', 'Pago'].includes(status)) {
         return res.status(400).json({ error: 'Status inválido' });
      }

      const metaAtualizada = await Meta.updateStatusMes(metaId, mesId, status);
      if (!metaAtualizada) {
         return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(metaAtualizada);
   } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

module.exports = router;
