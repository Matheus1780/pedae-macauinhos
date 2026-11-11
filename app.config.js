// APK demonstrativo tem identidade própria; não interfere no aplicativo de produção.
module.exports = ({ config }) => {
  if (process.env.PEDEAE_DEMO_APK !== '1') return config;
  const versionCode = Number(process.env.PEDEAE_ANDROID_VERSION_CODE || '1');
  if (!Number.isInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) {
    throw new Error('PEDEAE_ANDROID_VERSION_CODE inválido');
  }
  return {
    ...config,
    android: {
      ...config.android,
      package: 'com.pedeae.cliente.demo',
      versionCode,
      blockedPermissions: [
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },
  };
};
