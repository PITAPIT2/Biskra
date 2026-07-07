import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "pita-pit2",
  private_key_id: "b4e1559d8047071c9f4d762ea2544b7ae2239d73",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDO5mq6mhGB9ymU\nn5DABXO3bMz9IczEP42nQpdV7FpggLEb6bVEmlDerOI6KwkCIMNqFa+aMdACqiFY\n4xJ0sEObF7xlPuh1FGtFLeY4uXRCWNW03B+Jk13zOpkCUjJs/tSDsnseWiy8slRL\nedqGBxZuDrxNc6aZTSZj0zHGOcBB6sMrAXPEdaYglxBslhgot/tGpxa44bwQN4to\nGySzlfznYdjbSmbfHmj8/MttE2MiYN2R1toRR8PoU5Wj51nMh/z4oHTB8wAy37J0\n9F3EyxxnyvpXugUcmagXU+acNVBlcNVk1PGGGcmRRtm8SAl5/eShJdRr/zl53QmD\nR/32WJVFAgMBAAECggEAAnG8iKy9xjVtR32zoyH5duOUycovwik7WJ2DZ1+fo4yZ\n4YgiE2p1rHJE9iVJJQNRe0IW7FMEAPr5SgsUfpozWntbD7/mzlQnSosmaKt43THZ\nXjY+ceToUHNG9gWnRrEEVoUZvC05W4mojk8QabNfCEa+Sil3zMwBQ6RETvIYM8Wf\nJVWF45o9T+sq1MqEfAEZ0rhJ+cjk9+/IkjLfzNCdHsOW7sKz1md3tXsE489RRIOR\n3QNdxFMt2A2OF8rJPZQQp4eatZ4pWwmQ6dpRmghgdlYAvkLcOFJf2i8hqPhx6NRG\n+hEZxBkEQIJpysdXWo7hpI+EC12tqQC6A66esb98ZQKBgQDzFApLxETppJkH9Kr9\nXRmOygS6IoHRU5yxWPjrP5lmPCzJpgnjR+U1cpXaek4HOVH7tM7RAHT/r8W3vUCT\nUyTIlTMVsEWJgtpKkDVr6hQDc6SL+7r4T3Hv0QN3zxrfqAh8Vu2Uxk8JPut1SBnf\nlv5zWFX2nc11XUNZT3TTID0YZwKBgQDZ5gqHKtGp6C/rC7oIi2oGPh02UwdL0tld\nEnQpj01nV40395h27amMMpN7kC3RPzkCN4aH50BXimL1syxfPvMsQ+K75eV1bus2\nM/GNkgixTnM/qz20YOHZ9XRT/n7fBbHVSkCRFiBoJsKLHt2O+zfRcgleVOK01CaF\nCei9h70JcwKBgQCUd/AV+QpSXtutlU5/NEcxBMlAW2VJUrWJSRu4rH7oh+afP9AY\nR0iDjbpj2IIiPWuKvxP3aj0MEvND189CbO0xqpeqLqE6bXchRdWrVSzmMtMVQSsh\nEX05CkQBALmcVAji0UGJtlp9/jVYzDIpdBN0pkbTO+1LOyywtyxW7AEFDwKBgA06\nvUrlm6MwOLCRnrLkHATTAp0Iv3moDJBtDWZ0j+OFWkqamsQlu9SKQZAP+egpaYGr\n81wO+0YVXdrDDR+fR85ZNMvpslvF5zv8PV82DZcOR0sHT5DDDRNZpr1uxy8tPlXP\n00m7yS3ppIgj0JncwM/Tl6QFjVojQ09ygZH4Ss7nAoGBAIbm7/nrknWeyfrfSL62\ntdlB6935rNGZIHsb0HLXyynEqbI4UZtVfE3bM7+wm9Jkfdy8hGE6X7InJG77lagm\nXI0yKx2dylJvDbzqst1MVkRTV57+26888xk7nZ8h93fvF0O4G6FwwwiJfBqkUFTw\nntBxMVt1uKNSNyv1STGIctTc\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@pita-pit2.iam.gserviceaccount.com",
  client_id: "118172856385513533641",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40pita-pit2.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
} as const;

let _app: App | null = null;
let _db: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (_db) return _db;
  if (!getApps().length) {
    _app = initializeApp({ credential: cert(SERVICE_ACCOUNT as Parameters<typeof cert>[0]) });
  } else {
    _app = getApps()[0];
  }
  _db = getFirestore(_app);
  return _db;
}
