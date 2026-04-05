import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CONFIRM_FLAG = '--confirm-hosted-dev';
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1']);
const SEED_MARKER = '[seed:hosted-dev:v1]';
const JSON_CONTENT_TYPE = 'application/json';
const RESPONSE_PREVIEW_MAX_LENGTH = 240;
const ORG_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_ONE_ID = '22222222-2222-4222-8222-222222222221';
const PROJECT_TWO_ID = '22222222-2222-4222-8222-222222222222';

const SEEDED_USERS = [
  {
    email: 'owner@trakflow.test',
    name: 'Taylor Owner',
    role: 'OWNER',
  },
  {
    email: 'foreman@trakflow.test',
    name: 'Jordan Foreman',
    role: 'FOREMAN',
  },
  {
    email: 'crew1@trakflow.test',
    name: 'Alex Crew',
    role: 'CREW',
  },
  {
    email: 'crew2@trakflow.test',
    name: 'Sam Crew',
    role: 'CREW',
  },
  {
    email: 'crew3@trakflow.test',
    name: 'Riley Crew',
    role: 'CREW',
  },
];

const SEEDED_PROJECTS = [
  {
    id: PROJECT_ONE_ID,
    org_id: ORG_ID,
    project_name: 'Downtown Office Buildout',
    start_date: '2026-03-10',
    end_date: '2026-08-15',
    status: 'ACTIVE',
    budget_amount: '85000.00',
  },
  {
    id: PROJECT_TWO_ID,
    org_id: ORG_ID,
    project_name: 'North Yard Expansion',
    start_date: '2026-02-01',
    end_date: '2026-09-30',
    status: 'ACTIVE',
    budget_amount: '120000.00',
  },
];

const SEEDED_TOOLS = [
  {
    id: '33333333-3333-4333-8333-333333333331',
    name: 'Impact Driver',
    project_id: PROJECT_ONE_ID,
    status: 'AVAILABLE',
    condition: 'GOOD',
    notes: `${SEED_MARKER} Shared demo tool for office buildout work.`,
  },
  {
    id: '33333333-3333-4333-8333-333333333332',
    name: 'Rotary Hammer',
    project_id: PROJECT_TWO_ID,
    status: 'AVAILABLE',
    condition: 'FAIR',
    notes: `${SEED_MARKER} Shared demo tool for yard expansion work.`,
  },
  {
    id: '33333333-3333-4333-8333-333333333335',
    name: 'Jobsite Table Saw',
    project_id: null,
    status: 'OUT_OF_SERVICE',
    condition: 'DAMAGED',
    notes: `${SEED_MARKER} Demo damaged tool for maintenance flows.`,
  },
];

function loadEnvFileIfPresent(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, 'utf8');

  for (const rawLine of fileContents.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  loadEnvFileIfPresent(envPath);
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const responseText = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      const preview =
        responseText.length > RESPONSE_PREVIEW_MAX_LENGTH
          ? `${responseText.slice(0, RESPONSE_PREVIEW_MAX_LENGTH)}...`
          : responseText;
      const contentTypeSuffix = contentType
        ? ` with content-type ${contentType}`
        : '';

      throw new Error(
        `Received non-JSON response from ${url}${contentTypeSuffix}: ${preview}`,
      );
    }
  }

  if (!response.ok) {
    const message =
      data?.msg ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      response.statusText;
    throw new Error(`${response.status} ${message}`);
  }

  if (contentType && !contentType.includes(JSON_CONTENT_TYPE) && responseText) {
    const preview =
      responseText.length > RESPONSE_PREVIEW_MAX_LENGTH
        ? `${responseText.slice(0, RESPONSE_PREVIEW_MAX_LENGTH)}...`
        : responseText;

    throw new Error(
      `Expected JSON response from ${url} but received ${contentType}: ${preview}`,
    );
  }

  return data;
}

function createSupabaseAdminClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const bootstrapPassword = requireEnv('TRAKFLOW_BOOTSTRAP_TEST_PASSWORD');
  const hostedUrl = new URL(supabaseUrl);

  if (!process.argv.includes(CONFIRM_FLAG)) {
    throw new Error(`Refusing to run without ${CONFIRM_FLAG}.`);
  }

  if (LOCALHOST_HOSTNAMES.has(hostedUrl.hostname)) {
    throw new Error(
      'Refusing to run against localhost. Use supabase/seed.sql for local resets.',
    );
  }

  const baseHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  return {
    bootstrapPassword,
    projectId:
      process.env.SUPABASE_PROJECT_ID ||
      hostedUrl.hostname.split('.')[0] ||
      'unknown',
    authUrl: (relativePath) => `${supabaseUrl}/auth/v1${relativePath}`,
    restUrl: (table, query = '') => `${supabaseUrl}/rest/v1/${table}${query}`,
    headers: baseHeaders,
  };
}

async function listAuthUsers(client) {
  const users = [];
  let page = 1;
  let done = false;

  while (!done) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: '1000',
    });
    const data = await requestJson(
      client.authUrl(`/admin/users?${params.toString()}`),
      {
        headers: client.headers,
        method: 'GET',
      },
    );
    const pageUsers = data.users ?? [];

    users.push(...pageUsers);
    done = pageUsers.length < 1000;
    page += 1;
  }

  return users;
}

async function createAuthUser(client, user, password) {
  return requestJson(client.authUrl('/admin/users'), {
    method: 'POST',
    headers: client.headers,
    body: JSON.stringify({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
      },
    }),
  });
}

async function updateAuthUser(client, userId, user, password) {
  return requestJson(client.authUrl(`/admin/users/${userId}`), {
    method: 'PUT',
    headers: client.headers,
    body: JSON.stringify({
      password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
      },
    }),
  });
}

async function ensureAuthUsers(client) {
  const existingUsers = await listAuthUsers(client);
  const usersByEmail = new Map(
    existingUsers
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user]),
  );
  const createdOrUpdatedUsers = new Map();

  for (const user of SEEDED_USERS) {
    const existingUser = usersByEmail.get(user.email.toLowerCase());
    const result = existingUser
      ? await updateAuthUser(
          client,
          existingUser.id,
          user,
          client.bootstrapPassword,
        )
      : await createAuthUser(client, user, client.bootstrapPassword);
    const normalizedUser = result.user ?? result;

    createdOrUpdatedUsers.set(user.email, normalizedUser);
  }

  return createdOrUpdatedUsers;
}

function buildQuery(filters = [], extra = {}) {
  const params = new URLSearchParams(extra);

  for (const filter of filters) {
    const separatorIndex = filter.indexOf('=');

    if (separatorIndex <= 0) {
      throw new Error(`Invalid filter: ${filter}`);
    }

    const key = filter.slice(0, separatorIndex);
    const value = filter.slice(separatorIndex + 1);
    params.append(key, value);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

async function selectRows(
  client,
  table,
  { select = '*', filters = [], extra = {} } = {},
) {
  const query = buildQuery(filters, { ...extra, select });

  return requestJson(client.restUrl(table, query), {
    method: 'GET',
    headers: client.headers,
  });
}

async function insertRows(client, table, rows) {
  const payload = Array.isArray(rows) ? rows : [rows];

  return requestJson(client.restUrl(table), {
    method: 'POST',
    headers: {
      ...client.headers,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
}

async function patchRows(client, table, filters, values) {
  const query = buildQuery(filters);

  return requestJson(client.restUrl(table, query), {
    method: 'PATCH',
    headers: {
      ...client.headers,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(values),
  });
}

async function ensureRow(client, table, id, payload) {
  const existingRows = await selectRows(client, table, {
    select: 'id',
    filters: [`id=eq.${id}`],
  });

  if (existingRows.length === 0) {
    return insertRows(client, table, payload);
  }

  return patchRows(client, table, [`id=eq.${id}`], payload);
}

async function ensureTools(client) {
  for (const tool of SEEDED_TOOLS) {
    const existingRows = await selectRows(client, 'tools', {
      select: 'id',
      filters: [`id=eq.${tool.id}`],
    });

    if (existingRows.length === 0) {
      await insertRows(client, 'tools', {
        id: tool.id,
        org_id: ORG_ID,
        project_id: tool.project_id,
        name: tool.name,
        status: tool.status,
        condition: tool.condition,
        image_path: null,
        notes: tool.notes,
      });
      continue;
    }

    await patchRows(client, 'tools', [`id=eq.${tool.id}`], {
      org_id: ORG_ID,
      project_id: tool.project_id,
      name: tool.name,
      status: tool.status,
      condition: tool.condition,
      image_path: null,
      notes: tool.notes,
    });
  }
}

async function main() {
  loadEnv();
  const client = createSupabaseAdminClient();
  const usersByEmail = await ensureAuthUsers(client);
  const ownerUserId = usersByEmail.get('owner@trakflow.test')?.id;

  if (!ownerUserId) {
    throw new Error('Expected seeded auth users were not created correctly.');
  }

  for (const user of SEEDED_USERS) {
    const authUser = usersByEmail.get(user.email);

    await ensureRow(client, 'accounts', authUser.id, {
      id: authUser.id,
      org_id: null,
      name: user.name,
      email: user.email,
      role: 'CREW',
    });
  }

  await ensureRow(client, 'organizations', ORG_ID, {
    id: ORG_ID,
    name: 'TrakFlow Demo Organization',
    join_code: 'TRAK-FL8W',
    created_by: ownerUserId,
  });

  for (const user of SEEDED_USERS) {
    const authUser = usersByEmail.get(user.email);

    await ensureRow(client, 'accounts', authUser.id, {
      id: authUser.id,
      org_id: ORG_ID,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  for (const project of SEEDED_PROJECTS) {
    await ensureRow(client, 'projects', project.id, project);
  }

  await ensureTools(client);

  console.log(`Hosted dev bootstrap complete for project ${client.projectId}.`);
  console.log('Shared test accounts:');

  for (const user of SEEDED_USERS) {
    console.log(`  ${user.email} (${user.role})`);
  }

  console.log('Shared test password source: TRAKFLOW_BOOTSTRAP_TEST_PASSWORD.');
}

main().catch((error) => {
  console.error(`Hosted bootstrap failed: ${error.message}`);
  process.exitCode = 1;
});
