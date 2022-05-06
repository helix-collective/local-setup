import * as packages from "./packages.ts";
import {
  checkManifest,
  forPlatform,
  getHostPlatform,
  writeEnvScript,
  writeManifest,
} from "./setuputils.ts";

const DENO = packages.deno("1.13.1");
const ADL = packages.helixadl("1.1.4");
const NODE = packages.nodejs("14.17.6")
const YARN = packages.yarn("1.22.11")
const JDK = packages.adoptopenjdk("11.0.12+7")
const GRADLE = packages.gradle("7.4")

export async function main() {
  if (Deno.args.length != 1) {
    console.error("Usage: local-setup LOCALDIR");
    Deno.exit(1);
  }

  const platform = getHostPlatform();
  const localdir = Deno.args[0];

  const installs = [
    forPlatform(DENO, platform),
    forPlatform(ADL, platform),
    forPlatform(NODE, platform),
    forPlatform(JDK, platform),
    GRADLE,
    YARN,
  ];

  if (await checkManifest(installs, localdir)) {
    return;
  }

  for (const i of installs) {
    await i.install(localdir);
  }
  await writeEnvScript(installs, localdir);
  await writeManifest(installs, localdir);
}

main()
  .catch((err) => {
    console.error("error in main", err);
  });
