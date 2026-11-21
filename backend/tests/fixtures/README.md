# Certificados fictícios para testes unitários

`test-ca.pem` é uma CA fictícia; `test-leaf.pem` é um certificado fictício que não é CA. Nenhum deles pertence à Aiven ou a um ambiente real. As chaves privadas usadas para gerá-los foram descartadas e não estão no repositório.

A validade longa evita depender de renovações externas; os testes de expiração usam relógio controlado. Nunca utilizar estes certificados na configuração da aplicação. O teste de integração gera suas próprias CAs, certificados e chaves temporários e remove tudo ao terminar.
