# API de Registros

## Endpoint: `/api/registros/count`

**Método:** GET  
**Descrição:** Retorna o número total de registros na coleção "registros" do Firestore.

### Resposta de Sucesso (200):
```json
{
  "count": 1234
}
```

### Resposta de Erro (500):
```json
{
  "error": "Erro interno do servidor ao contar registros"
}
```

### Exemplo de Uso:

#### JavaScript/Fetch:
```javascript
fetch('/api/registros/count')
  .then(response => response.json())
  .then(data => {
    console.log('Total de registros:', data.count);
  })
  .catch(error => {
    console.error('Erro:', error);
  });
```

#### React Hook:
```javascript
import { useState, useEffect } from 'react';

function useRegistrosCount() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/registros/count')
      .then(response => response.json())
      .then(data => {
        setCount(data.count);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  return { count, loading, error };
}
```

#### cURL:
```bash
curl https://seu-dominio.vercel.app/api/registros/count
```

### Vantagens desta abordagem:

1. ✅ **Mais simples** - Não precisa de Firebase Functions
2. ✅ **Mais rápido** - Executa na mesma região da Vercel
3. ✅ **Mais barato** - Sem custos adicionais do Firebase Functions
4. ✅ **Mesmo Firebase Admin SDK** - Usa a configuração existente
5. ✅ **Deploy automático** - Deploy junto com o resto da aplicação
