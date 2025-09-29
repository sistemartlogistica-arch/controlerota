# Exemplo de Uso do Componente RegistrosCount

## Onde foi integrado:

O componente `RegistrosCount` foi integrado na **seção Registros** da página admin, especificamente:

- **Localização:** Registros (count)
- **Posição:** No topo da seção, antes dos filtros de data
- **Estilo:** Card destacado com gradiente verde

## Como aparece na interface:

```
┌─────────────────────────────────────────────────────────┐
│                    Registros (1,757)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    ┌─────────────────────────────────────────────┐     │
│    │  Total de registros: 1,757                 │     │
│    └─────────────────────────────────────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Filtros de Data: [Início] [Fim] [Aplicar]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Tabela de Registros...                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Funcionalidades:

1. **✅ Carregamento automático** - Busca a contagem ao montar o componente
2. **✅ Estado de loading** - Mostra "Carregando..." enquanto busca
3. **✅ Tratamento de erro** - Exibe mensagem de erro se falhar
4. **✅ Formatação de números** - Usa `toLocaleString()` para separar milhares
5. **✅ Estilo responsivo** - Adapta-se ao layout da página

## API utilizada:

- **Endpoint:** `/api/registros/count`
- **Método:** GET
- **Resposta:** `{"count": 1757}`
- **Tecnologia:** Firebase Admin SDK com aggregate query

## Estilos aplicados:

- **Gradiente azul** para destaque visual
- **Sombra sutil** para profundidade
- **Hover effect** com animação
- **Bordas arredondadas** para modernidade
- **Cores consistentes** com o tema da aplicação
