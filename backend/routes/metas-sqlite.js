const express = require('express');
const MetaSQLite = require('../models/MetaSQLite');
const router = express.Router();

// Instância do modelo SQLite
const metaModel = new MetaSQLite();

// GET /metas - Listar todas as metas
router.get('/', async (req, res) => {
   try {
      const metas = await metaModel.findAll();
      res.json(metas);
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

      const meta = await metaModel.findById(id);
      if (!meta) {
         return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(meta);
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

      const novaMeta = await metaModel.create(metaData);
      res.status(201).json(novaMeta);
   } catch (error) {
      console.error('Erro ao criar meta:', error);
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

      const metaAtualizada = await metaModel.update(id, metaData);
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

      const deletado = await metaModel.delete(id);
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

      const metaAtualizada = await metaModel.updateMes(
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

module.exports = router;
