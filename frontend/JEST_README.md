# Jest Configuration para Angular

Este projeto foi configurado para usar Jest como framework de testes em vez do Karma.

## Scripts Disponíveis

### Executar Testes

```bash
# Executar todos os testes uma vez
npm run test:jest

# Executar testes em modo watch (recomendado para desenvolvimento)
npm run test:watch

# Executar testes com coverage
npm run test:coverage

# Executar testes para CI/CD
npm run test:ci
```

### Comandos Alternativos

```bash
# Usando o Angular CLI (ainda funciona)
ng test

# Executar Jest diretamente
npx jest

# Executar Jest com coverage
npx jest --coverage
```

## Configuração

### Arquivos de Configuração

- `jest.config.js` - Configuração principal do Jest
- `setup-jest.ts` - Setup específico para Angular
- `tsconfig.spec.json` - Configuração TypeScript para testes

### Coverage

O coverage está configurado para:

- **Diretório**: `coverage/`
- **Formatos**: HTML, Text, Text-Summary, LCOV
- **Threshold**: 80% para branches, functions, lines e statements
- **Exclusões**: Arquivos de módulo, specs, testes, etc.

## Estrutura de Testes

### Convenções de Nomenclatura

- Arquivos de teste: `*.spec.ts` ou `*.test.ts`
- Testes de componentes: `component.spec.ts`
- Testes de serviços: `service.spec.ts`

### Exemplos de Testes

#### Teste de Componente

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { MyComponent } from "./my.component";

describe("MyComponent", () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
```

#### Teste de Serviço

```typescript
import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { MyService } from "./my.service";

describe("MyService", () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
```

## Relatórios de Coverage

Após executar `npm run test:coverage`, você pode encontrar:

1. **Relatório HTML**: `coverage/index.html` - Abra no navegador para visualização detalhada
2. **Relatório de Console**: Mostra resumo no terminal
3. **Relatório LCOV**: `coverage/lcov.info` - Para integração com ferramentas externas

## Troubleshooting

### Problemas Comuns

1. **Erro de módulo não encontrado**

   - Verifique se o caminho está correto no `jest.config.js`
   - Use `moduleNameMapping` para mapear caminhos

2. **Erro de setup**

   - Verifique se `setup-jest.ts` está incluído no `tsconfig.spec.json`
   - Certifique-se de que `jest-preset-angular` está instalado

3. **Problemas com coverage**
   - Verifique se os arquivos não estão sendo excluídos incorretamente
   - Ajuste `collectCoverageFrom` no `jest.config.js`

### Debug

```bash
# Executar Jest com debug
npx jest --verbose

# Executar teste específico
npx jest --testNamePattern="should create"

# Executar arquivo específico
npx jest my.component.spec.ts
```

## Migração do Karma

Se você estava usando Karma anteriormente:

1. Os testes existentes devem funcionar sem modificação
2. Apenas certifique-se de que as importações estão corretas
3. Use `HttpClientTestingModule` para testes de serviços HTTP
4. Use `RouterTestingModule` para testes de componentes com roteamento

## Integração com CI/CD

Para integração contínua, use:

```bash
npm run test:ci
```

Este comando:

- Executa todos os testes
- Gera relatório de coverage
- Falha se o coverage estiver abaixo do threshold
- Não executa em modo watch
