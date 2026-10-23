import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const android = join(root, 'android', 'app', 'src', 'main');
if (!existsSync(android)) {
  console.error('Plateforme Android absente. Exécuter npm install puis npx cap add android.');
  process.exit(1);
}
const java = join(android, 'java', 'com', 'reigninblood', 'slimotv');
mkdirSync(java, { recursive: true });
copyFileSync(join(root, 'native/android/ConsumerIrPlugin.java'), join(java, 'ConsumerIrPlugin.java'));
const activity = join(java, 'MainActivity.java');
if (!existsSync(activity)) throw new Error('MainActivity.java introuvable, vérifiez le package Android.');
let content = readFileSync(activity, 'utf8');
if (!content.includes('registerPlugin(ConsumerIrPlugin.class)')) {
  const marker = 'public class MainActivity extends BridgeActivity {';
  if (!content.includes(marker)) throw new Error('Structure MainActivity.java non reconnue : enregistrement manuel requis.');
  content = content.replace(marker, marker + '\n  @Override public void onCreate(android.os.Bundle savedInstanceState) {\n    registerPlugin(ConsumerIrPlugin.class);\n    super.onCreate(savedInstanceState);\n  }');
  writeFileSync(activity, content);
}
const manifest = join(android, 'AndroidManifest.xml');
let xml = readFileSync(manifest, 'utf8');
if (!xml.includes('android.permission.TRANSMIT_IR')) {
  xml = xml.replace(/<manifest([^>]*)>/, match => match + '\n    <uses-permission android:name="android.permission.TRANSMIT_IR" />');
  writeFileSync(manifest, xml);
}
console.log('ConsumerIrPlugin installé et enregistré dans Android.');
