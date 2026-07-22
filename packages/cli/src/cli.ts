import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { DEFAULT_API_URL, FormaglyphCatalogClient, type IconAsset, type IconVariant } from "./catalog.js";
import { startStdioServer } from "./stdio.js";

const VERSION = "0.1.0";

const HELP = `Formaglyph CLI ${VERSION}

Usage:
  formaglyph search [query] [--variant regular|solid] [--category name] [--limit 12] [--json]
  formaglyph get <stable-id> [--json]
  formaglyph svg <stable-id> [--variant regular|solid] [--version 0.1.0] [--output file] [--force]
  formaglyph manifest [--json]
  formaglyph mcp

Global options:
  --api-url <url>  Override the public API endpoint (HTTPS, or localhost HTTP)
  --help           Show this help
  --version        Show the CLI version

The catalog, CLI, and MCP tools are public and read-only.`;

interface CliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

interface CliDependencies {
  createClient: (apiUrl: string) => FormaglyphCatalogClient;
  startMcp: (apiUrl: string) => Promise<unknown>;
}

const defaultIo: CliIo = {
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
};

function takeApiUrl(argv: string[]) {
  const args = [...argv];
  let apiUrl = process.env.FORMAGLYPH_API_URL ?? DEFAULT_API_URL;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--api-url") {
      const value = args[index + 1];
      if (!value) throw new TypeError("--api-url requires a value.");
      apiUrl = value;
      args.splice(index, 2);
      index -= 1;
    } else if (args[index].startsWith("--api-url=")) {
      apiUrl = args[index].slice("--api-url=".length);
      args.splice(index, 1);
      index -= 1;
    }
  }
  return { args, apiUrl };
}

function printSearchResult(items: IconAsset[], total: number) {
  if (!items.length) return "No Formaglyph icons matched.\n";
  const rows = items.map((item) => `${item.stableId.padEnd(28)} ${item.variant.padEnd(7)} ${item.category.padEnd(14)} ${item.label}`);
  return `${rows.join("\n")}\n\n${items.length} of ${total} matching assets.\n`;
}

export async function runCli(argv: string[], io: CliIo = defaultIo, dependencies: Partial<CliDependencies> = {}) {
  const { args, apiUrl } = takeApiUrl(argv);
  const command = args.shift();
  if (!command || command === "help" || command === "--help" || command === "-h") {
    io.stdout(`${HELP}\n`);
    return 0;
  }
  if (command === "--version" || command === "-v" || command === "version") {
    io.stdout(`${VERSION}\n`);
    return 0;
  }

  const client = (dependencies.createClient ?? ((url) => new FormaglyphCatalogClient(url)))(apiUrl);

  if (command === "search") {
    const parsed = parseArgs({ args, allowPositionals: true, strict: true, options: {
      category: { type: "string" },
      variant: { type: "string" },
      limit: { type: "string", default: "12" },
      json: { type: "boolean", default: false },
    } });
    if (parsed.values.variant && !["regular", "solid"].includes(parsed.values.variant)) throw new TypeError("--variant must be regular or solid.");
    const limit = Number(parsed.values.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new TypeError("--limit must be an integer from 1 to 100.");
    const result = await client.search({
      query: parsed.positionals.join(" "),
      category: parsed.values.category,
      variant: parsed.values.variant as IconVariant | undefined,
      limit,
    });
    io.stdout(parsed.values.json ? `${JSON.stringify(result, null, 2)}\n` : printSearchResult(result.data, result.page.total));
    return 0;
  }

  if (command === "get") {
    const parsed = parseArgs({ args, allowPositionals: true, strict: true, options: { json: { type: "boolean", default: false } } });
    const stableId = parsed.positionals[0];
    if (!stableId || parsed.positionals.length !== 1) throw new TypeError("get requires exactly one stable icon ID.");
    const icon = await client.getIcon(stableId);
    if (parsed.values.json) io.stdout(`${JSON.stringify(icon, null, 2)}\n`);
    else io.stdout(`${icon.label}\n${icon.stableId} · ${icon.category} · ${icon.licence}\n${icon.description}\nVariants: ${icon.variants.map((item) => `${item.variant}@${item.version}`).join(", ")}\n`);
    return 0;
  }

  if (command === "svg") {
    const parsed = parseArgs({ args, allowPositionals: true, strict: true, options: {
      variant: { type: "string", default: "regular" },
      version: { type: "string" },
      output: { type: "string", short: "o" },
      force: { type: "boolean", default: false },
    } });
    const stableId = parsed.positionals[0];
    if (!stableId || parsed.positionals.length !== 1) throw new TypeError("svg requires exactly one stable icon ID.");
    if (!["regular", "solid"].includes(parsed.values.variant)) throw new TypeError("--variant must be regular or solid.");
    const { svg, asset } = await client.getSvg(stableId, parsed.values.variant as IconVariant, parsed.values.version);
    if (!parsed.values.output || parsed.values.output === "-") {
      io.stdout(svg);
      return 0;
    }
    const output = resolve(parsed.values.output);
    await writeFile(output, svg, { encoding: "utf8", flag: parsed.values.force ? "w" : "wx" });
    io.stderr(`Saved ${asset.name} ${asset.variant}@${asset.version} to ${output}\n`);
    return 0;
  }

  if (command === "manifest") {
    const parsed = parseArgs({ args, allowPositionals: false, strict: true, options: { json: { type: "boolean", default: false } } });
    const manifest = await client.getManifest();
    if (parsed.values.json) io.stdout(`${JSON.stringify(manifest, null, 2)}\n`);
    else io.stdout(`${manifest.name} ${manifest.version}\n${manifest.conceptCount} concepts · ${manifest.assetCount} assets · ${manifest.grid}px grid · ${manifest.licence}\n`);
    return 0;
  }

  if (command === "mcp") {
    if (args.length) throw new TypeError("mcp does not accept positional arguments.");
    await (dependencies.startMcp ?? ((url) => startStdioServer(url)))(apiUrl);
    return 0;
  }

  throw new TypeError(`Unknown command: ${command}. Run formaglyph --help.`);
}

function isDirectInvocation() {
  return Boolean(process.argv[1]) && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
}

if (isDirectInvocation()) {
  runCli(process.argv.slice(2)).catch((error) => {
    defaultIo.stderr(`Formaglyph: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
