import * as path from "https://deno.land/std@0.101.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.101.0/fs/mod.ts";
import {
  cachedDownload,
  denoInstallable,
  exec,
  DownloadFile,
  Installable,
  mapPlatform,
  MultiPlatform,
  setVariable,
  addToPath,
  unPackage,
  tarPackage,
  unzip,
  withEnv,
  withPostInstall,
  zippedBinary,
  zippedPackage,
} from "./setuputils.ts";

// Deno installable
export function deno(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://github.com/denoland/deno/releases/download/v${version}/deno-x86_64-unknown-linux-gnu.zip`,
      cachedName: `deno-v${version}-x86_64-unknown-linux-gnu.zip`,
    },
    darwin_x86_64: {
      url:
        `https://github.com/denoland/deno/releases/download/v${version}/deno-x86_64-apple-darwin.zip`,
      cachedName: `deno-v${version}-x86_64-apple-darwin.zip`,
    },
  };

  function env(localdir: string) {
    return [
      setVariable("DENO_INSTALL", localdir),
      setVariable("DENO_INSTALL_ROOT", localdir),
    ]
  }

  function install(url: DownloadFile) {
    return withEnv(zippedBinary(url), env);
  }

  return mapPlatform(urls, install);
}

// nodejs installable
export function nodejs(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz`,
      cachedName: `node-v${version}-linux-x64.tar.xz`,
    },
    darwin_x86_64: {
      url:
        `https://nodejs.org/dist/v${version}/node-v${version}-darwin-x64.tar.gz`,
      cachedName: `node-v${version}-darwin-x64.tar.gz`,
    },
  };

  return {
    linux_x86_64: withEnv(tarPackage(urls.linux_x86_64, '--xz'), (localdir) => [
      addToPath(path.join(localdir,`node-v${version}-linux-x64/bin`)),
    ]),
    darwin_x86_64: withEnv(tarPackage(urls.darwin_x86_64, '--gzip'), (localdir) => [
      addToPath(path.join(localdir,`node-v${version}-darwin-x64/bin`)),
    ]),
  }
}

// adoptopenjdk installable
export function adoptopenjdk(version: string): MultiPlatform<Installable> {
  const uversion = version.replace('+','_');
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://github.com/adoptium/temurin11-binaries/releases/download/jdk-${version}/OpenJDK11U-jdk_x64_linux_hotspot_${uversion}.tar.gz`,
      cachedName: `OpenJDK11U-jdk_x64_linux_hotspot_${uversion}.tar.gz`,
    },
    darwin_x86_64: {
      url:
        `https://github.com/adoptium/temurin11-binaries/releases/download/jdk-${version}/OpenJDK11U-jdk_x64_mac_hotspot_${uversion}.tar.gz`,
      cachedName: `OpenJDK11U-jdk_x64_mac_hotspot_${uversion}.tar.gz`,
    },
  };

  function env(localdir: string) {
    return [

    ]
  }

  return {
    linux_x86_64: 
      withEnv(tarPackage(urls.linux_x86_64, '--gzip'), (localdir) => [
        setVariable("JAVA_HOME", path.join(localdir, `jdk-${version}`)),
        addToPath(path.join(localdir,  `jdk-${version}/bin`)),
      ]),
    darwin_x86_64:  
      // Sigh... the macos jdk has Contents/Home as a prefix in the tar file,
      withEnv(tarPackage(urls.darwin_x86_64, '--gzip'), (localdir) => [
        setVariable("JAVA_HOME", path.join(localdir, `jdk-${version}/Contents/Home`)),
        addToPath(path.join(localdir,  `jdk-${version}/Contents/Home/bin`)),
      ]),
  }
}

// bazel installable
export function bazel(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://github.com/bazelbuild/bazel/releases/download/${version}/bazel-${version}-installer-linux-x86_64.sh`,
      cachedName: `bazel-${version}-installer-linux-x86_64.sh`,
    },
    darwin_x86_64: {
      url:
        `https://github.com/bazelbuild/bazel/releases/download/${version}/bazel-${version}-installer-darwin-x86_64.sh`,
      cachedName: `bazel-${version}-installer-darwin-x86_64.sh`,
    },
  };

  function install(url: DownloadFile): Installable {
    return {
      manifestName: url.cachedName,
      install: async (localdir: string): Promise<void> => {
        const shellscript = await cachedDownload(url);
        console.log(`installing ${url.cachedName}`);
        const installdir = path.join(localdir, `bazel-${version}`)
        await exec({
          cmd: ['/bin/bash', shellscript, `--prefix=${installdir}`],
          stdout: 'null'
        })
        await fs.ensureSymlink(
          path.join(installdir, "bin/bazel"),
          path.join(localdir, "bin/bazel"),
        );
      },
      env: () => [],
    }
  }

  return mapPlatform(urls, install);
}

export function pulumi(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    darwin_aarch64: {
      url: `https://get.pulumi.com/releases/sdk/pulumi-v${version}-darwin-arm64.tar.gz`,
      cachedName: `pulumi-v${version}-darwin-arm64.tar.gz`
    },
    darwin_x86_64: {
      url: `https://get.pulumi.com/releases/sdk/pulumi-v${version}-darwin-x64.tar.gz`,
      cachedName: `pulumi-v${version}-darwin-x64.tar.gz`
    },
    linux_x86_64: {
      url: `https://get.pulumi.com/releases/sdk/pulumi-v${version}-linux-x64.tar.gz`,
      cachedName: `pulumi-v${version}-linux-x64.tar.gz`
    }
  }

  function install(df: DownloadFile): Installable {
    const installable = tarPackage(df, "--gzip");
    return {
      manifestName: installable.manifestName,
      install: installable.install,
      env: (localdir) => ([
        addToPath(path.join(localdir as string, "pulumi"))
      ])
    };
  }

  return mapPlatform(urls, install);
}

// gradle installable
export function gradle(version: string): Installable {
  const url: DownloadFile = {
    url:
      `https://downloads.gradle-dn.com/distributions/gradle-${version}-bin.zip`,
    cachedName: `gradle-${version}-bin.zip`,
  }

  return withEnv(zippedPackage(url), (localdir) => [
    addToPath(path.join(localdir,`gradle-${version}/bin`)),
  ])   
}


// yarn installable
export function yarn(version: string): Installable {
  const url: DownloadFile = {
    url:
      `https://github.com/yarnpkg/yarn/releases/download/v${version}/yarn-v${version}.tar.gz`,
    cachedName: `yarn-v${version}.tar.gz`,
  }

  return withEnv(tarPackage(url, '--gzip'), (localdir) => [
    addToPath(path.join(localdir,`yarn-v${version}/bin`)),
  ])      
}

// Terraform installable
export function terraform(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_linux_amd64.zip`,
      cachedName: `terraform_${version}_linux_amd64.zip`,
    },
    darwin_x86_64: {
      url:
        `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_darwin_amd64.zip`,
      cachedName: `terraform_${version}_darwin_amd64.zip`,
    },
  };

  return mapPlatform(urls, zippedBinary);
}

// standard ADL tooling
export function adl(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://github.com/timbod7/adl/releases/download/v${version}/adl-bindist-${version}-linux.zip`,
      cachedName: `adl-bindist-${version}-linux.zip`,
    },
    darwin_x86_64: {
      url:
        `https://github.com/timbod7/adl/releases/download/v${version}/adl-bindist-${version}-osx.zip`,
      cachedName: `adl-bindist-${version}-osx.zip`,
    },
  };

  return mapPlatform(urls, zippedPackage);
}

// helix fork of ADL tooling
export function helixadl(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://github.com/helix-collective/adl/releases/download/v${version}/adl-bindist-${version}-linux.zip`,
      cachedName: `helixadl-bindist-${version}-linux.zip`,
    },
    darwin_x86_64: {
      url:
        `https://github.com/helix-collective/adl/releases/download/v${version}/adl-bindist-${version}-osx.zip`,
      cachedName: `helixadl-bindist-${version}-osx.zip`,
    },
  };

  return mapPlatform(urls, zippedPackage);
}

// AWS cli
export function awscli(version: string): MultiPlatform<Installable> {
  const urls: MultiPlatform<DownloadFile> = {
    linux_x86_64: {
      url:
        `https://awscli.amazonaws.com/awscli-exe-linux-x86_64-${version}.zip`,
      cachedName: `awscli-exe-linux-x86_64-${version}.zip`,
    },
    darwin_x86_64: {
      url: `https://awscli.amazonaws.com/AWSCLIV2-${version}.pkg`,
      cachedName: `AWSCLIV2-${version}.pkg`,
    },
  };

  return {
    // Irritatingly, we have different packaging on macos vs linux
    linux_x86_64: {
      manifestName: urls.linux_x86_64.cachedName,
      install: async (localdir: string): Promise<void> => {
        const zipfile = await cachedDownload(urls.linux_x86_64);
        await unzip(zipfile, path.join(localdir, "lib"));
        await fs.ensureSymlink(
          path.join(localdir, "lib/aws/dist/aws"),
          path.join(localdir, "bin/aws"),
        );
      },
      env: () => [],
    },
    darwin_x86_64: {
      manifestName: urls.darwin_x86_64.cachedName,
      install: async (localdir: string): Promise<void> => {
        const pkgfile = await cachedDownload(urls.darwin_x86_64);
        await unPackage(pkgfile, path.join(localdir, "lib"));
        await fs.ensureSymlink(
          path.join(localdir, "lib/aws-cli/aws"),
          path.join(localdir, "bin/aws"),
        );
      },
      env: () => [],
    },
  };
}

// AWS session manager
//
// repackaged into the hx-localdevtools repo, as AWS itself only supports downloading
// the most recent releases in hard to use pakage formats.
export function awssessionmanager(version: string): MultiPlatform<Installable> {
  const urls : MultiPlatform<DownloadFile> =
  {
    linux_x86_64: {
      url: `https://raw.githubusercontent.com/helix-collective/hx-localdevtools/main/sessionmanagerplugin_${version}_linux_amd64.zip`,
      cachedName: `sessionmanagerplugin_${version}_linux_amd64.zip`,
    },
    darwin_x86_64: {
      url: `https://raw.githubusercontent.com/helix-collective/hx-localdevtools/main/sessionmanagerplugin_${version}_darwin_amd64.zip`,
      cachedName: `sessionmanagerplugin_${version}_darwin_amd64.zip`,
    },
  };

  return mapPlatform(urls, zippedBinary);
}

export function dnit(version: string): Installable {
  return denoInstallable(
    "dnit",
    `https://deno.land/x/dnit@dnit-v${version}/main.ts`,
  );
}

