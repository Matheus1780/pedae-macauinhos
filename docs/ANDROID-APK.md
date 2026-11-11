# APK Android demonstrativo

O workflow **Build Android demo APK** (`.github/workflows/android-apk.yml`) gera
um APK instalável e assinado para testar o PedeAê, sem depender do Expo Go ou de
um servidor Metro. O JavaScript/Hermes e as imagens dos produtos ficam no pacote.

## Gerar outra versão

No GitHub, abra **Actions → Build Android demo APK → Run workflow**, na branch
`main`. Depois do sucesso, baixe o artefato **PedeAe-Android-APK** e extraia o ZIP.
O arquivo para instalar é **PedeAe-Android-teste.apk**. O número de versão Android
aumenta a cada execução do workflow. Não é preciso criar uma conta Expo para esta compilação.

## Instalar

1. Baixe o APK no celular Android.
2. Abra o arquivo em **Downloads**.
3. Se o Android solicitar, permita a instalação deste arquivo pelo navegador ou
   gerenciador de arquivos utilizado. Essa permissão não exige desativar o Play Protect.
4. Toque em **Instalar** e depois em **Abrir**. Nas próximas vezes use o ícone PedeAê.

O mínimo de Android e as arquiteturas estão no arquivo `android-info.txt` entregue
com o APK. A build inclui ARM 32 bits, ARM 64 bits e x86_64. O ícone é o da marca PedeAê.

## Identidade, assinatura e limites

- Pacote separado: `com.pedeae.cliente.demo`. A futura versão comercial usa a
  identidade de produção, sem sobrescrever esta demonstração.
- Variante release com bundle embutido, assinada com a chave de desenvolvimento
  padrão do projeto gerado pelo Expo. **Não é uma assinatura de distribuição comercial**.
  Essa chave é pública/conhecida e não deve ser usada para a versão da loja.
- Para Google Play: configurar chave privada de produção / Play App Signing e gerar AAB.
- OTP de teste: **123456**. Compras, pagamento, entregas e chat continuam simulados.
- Os dados ficam no próprio aparelho; não há sincronização entre dispositivos.
- Capas externas de mercados precisam de internet. O catálogo ilustrado é incluído no APK.
- SHA-256 e verificação de assinatura são entregues junto ao artefato.
