import test from 'node:test';
import assert from 'node:assert/strict';
import { runPdfUploadFlow } from '../src/pages/pdfUploadFlow.js';

const metadata = {
  company_id: 'company-1',
  role: 'Engineer',
  batch: '2026',
  package: '12 LPA',
  opportunity_type: 'Full-time',
  selection_status: 'Selected',
  consent: true,
};

function createHarness() {
  const uploaded = [];
  const patched = [];
  const sessions = [];
  return {
    uploaded,
    patched,
    sessions,
    uploadPdf: async (file) => {
      uploaded.push(file);
      return { source_file: 'stable-source-file' };
    },
    patchExperience: async (id, values) => patched.push({ id, values }),
    onSessionChange: (session) => sessions.push(session),
  };
}

test('timeout preserves the upload session and resume polls without uploading again', async () => {
  const harness = createHarness();
  const first = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    pdfStatus: async () => ({
      id: 'experience-1',
      submitted_by: 'user-1',
      extraction_status: 'processing',
      company_id: null,
    }),
    maxAttempts: 1,
    pollIntervalMs: 0,
    delay: async () => {},
    ...harness,
  });

  assert.equal(first.status, 'pending');
  assert.equal(first.session.sourceFile, 'stable-source-file');
  assert.equal(first.session.experienceId, 'experience-1');
  assert.equal(first.session.metadataAttached, true);
  assert.equal(harness.uploaded.length, 1);
  assert.equal(harness.patched.length, 1);

  const resumed = await runPdfUploadFlow({
    session: first.session,
    metadata,
    userId: 'user-1',
    uploadPdf: harness.uploadPdf,
    patchExperience: harness.patchExperience,
    onSessionChange: harness.onSessionChange,
    pdfStatus: async () => ({
      id: 'experience-1',
      submitted_by: 'user-1',
      extraction_status: 'completed',
      company_id: 'company-1',
    }),
    maxAttempts: 1,
    pollIntervalMs: 0,
    delay: async () => {},
  });

  assert.equal(resumed.status, 'completed');
  assert.equal(harness.uploaded.length, 1);
  assert.equal(harness.patched.length, 1);
});

test('resumes when the experience row is created after the initial timeout', async () => {
  const harness = createHarness();
  const pending = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    pdfStatus: async () => null,
    maxAttempts: 1,
    ...harness,
  });

  assert.equal(pending.status, 'pending');
  assert.equal(pending.session.experienceId, null);
  assert.equal(pending.session.metadataAttached, false);

  const resumed = await runPdfUploadFlow({
    session: pending.session,
    metadata,
    userId: 'user-1',
    uploadPdf: harness.uploadPdf,
    pdfStatus: async () => ({
      id: 'experience-1',
      submitted_by: 'user-1',
      extraction_status: 'completed',
      company_id: null,
    }),
    patchExperience: harness.patchExperience,
    onSessionChange: harness.onSessionChange,
    maxAttempts: 1,
  });

  assert.equal(resumed.status, 'completed');
  assert.equal(harness.uploaded.length, 1);
  assert.equal(harness.patched.length, 1);
});

test('attaches only missing metadata after the owned experience is available', async () => {
  const harness = createHarness();
  const existing = {
    id: 'experience-1',
    submitted_by: 'user-1',
    extraction_status: 'completed',
    company_id: 'company-existing',
    role: null,
    batch: '2025',
    package: null,
    opportunity_type: 'Internship',
    selection_status: null,
    consent: true,
  };

  const result = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    pdfStatus: async () => existing,
    maxAttempts: 1,
    ...harness,
  });

  assert.equal(result.status, 'completed');
  assert.deepEqual(harness.patched, [{
    id: 'experience-1',
    values: {
      role: 'Engineer',
      package: '12 LPA',
      selection_status: 'Selected',
    },
  }]);
});

test('reports upload failure without beginning status polling', async () => {
  const harness = createHarness();
  const uploadError = new Error('upload unavailable');
  const result = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    uploadPdf: async () => { throw uploadError; },
    pdfStatus: async () => assert.fail('status must not be queried'),
    patchExperience: harness.patchExperience,
    onSessionChange: harness.onSessionChange,
  });

  assert.equal(result.status, 'upload_failed');
  assert.equal(result.error, uploadError);
});

test('reports status-service failures separately from processing pending', async () => {
  const harness = createHarness();
  const statusError = new Error('status service unavailable');
  const result = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    uploadPdf: harness.uploadPdf,
    pdfStatus: async () => { throw statusError; },
    patchExperience: harness.patchExperience,
    onSessionChange: harness.onSessionChange,
    maxAttempts: 1,
  });

  assert.equal(result.status, 'status_unavailable');
  assert.equal(result.error, statusError);
  assert.equal(result.session.sourceFile, 'stable-source-file');
  assert.equal(harness.uploaded.length, 1);
});

test('attaches available metadata and reports processing failure', async () => {
  const harness = createHarness();
  const result = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    pdfStatus: async () => ({
      id: 'experience-1',
      submitted_by: 'user-1',
      extraction_status: 'failed',
      company_id: null,
    }),
    maxAttempts: 1,
    ...harness,
  });

  assert.equal(result.status, 'processing_failed');
  assert.equal(result.session.metadataAttached, true);
  assert.equal(harness.patched.length, 1);
});

test('preserves the session when metadata attachment fails so the patch can be retried', async () => {
  const harness = createHarness();
  const patchError = new Error('metadata save failed');
  const result = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    pdfStatus: async () => ({
      id: 'experience-1',
      submitted_by: 'user-1',
      extraction_status: 'processing',
      company_id: null,
    }),
    uploadPdf: harness.uploadPdf,
    patchExperience: async () => { throw patchError; },
    onSessionChange: harness.onSessionChange,
    maxAttempts: 1,
  });

  assert.equal(result.status, 'metadata_failed');
  assert.equal(result.error, patchError);
  assert.equal(result.session.sourceFile, 'stable-source-file');
  assert.equal(result.session.metadataAttached, false);
  assert.equal(harness.uploaded.length, 1);
});

test('resumes a failed metadata patch without uploading the PDF again', async () => {
  const harness = createHarness();
  const failedSession = {
    sourceFile: 'stable-source-file',
    experienceId: 'experience-1',
    metadataAttached: false,
    metadata,
  };
  const result = await runPdfUploadFlow({
    session: failedSession,
    metadata,
    userId: 'user-1',
    uploadPdf: harness.uploadPdf,
    pdfStatus: async () => ({
      id: 'experience-1',
      submitted_by: 'user-1',
      extraction_status: 'completed',
      company_id: null,
    }),
    patchExperience: harness.patchExperience,
    onSessionChange: harness.onSessionChange,
    maxAttempts: 1,
  });

  assert.equal(result.status, 'completed');
  assert.equal(harness.uploaded.length, 0);
  assert.equal(harness.patched.length, 1);
});

test('does not attach metadata when the status record is not owned by the user', async () => {
  const harness = createHarness();
  const result = await runPdfUploadFlow({
    file: 'pdf-file',
    metadata,
    userId: 'user-1',
    pdfStatus: async () => ({
      id: 'experience-other-user',
      submitted_by: 'user-2',
      extraction_status: 'completed',
    }),
    maxAttempts: 1,
    ...harness,
  });

  assert.equal(result.status, 'pending');
  assert.equal(harness.patched.length, 0);
});
