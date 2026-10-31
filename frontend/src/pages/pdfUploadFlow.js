function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function missingMetadata(metadata, experience) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([field]) =>
      experience[field] === null ||
      experience[field] === undefined ||
      experience[field] === ''
    )
  );
}

export async function runPdfUploadFlow({
  file,
  session,
  metadata,
  userId,
  uploadPdf,
  pdfStatus,
  patchExperience,
  onSessionChange,
  maxAttempts = 30,
  pollIntervalMs = 3000,
  delay = wait,
}) {
  let activeSession = session;

  if (!activeSession) {
    try {
      const upload = await uploadPdf(file);
      if (!upload?.source_file) {
        return {
          status: 'upload_failed',
          error: new Error('The upload response did not include a source file ID.'),
        };
      }
      activeSession = {
        sourceFile: upload.source_file,
        experienceId: null,
        metadataAttached: false,
        metadata,
      };
      onSessionChange(activeSession);
    } catch (error) {
      return { status: 'upload_failed', error };
    }
  }

  let receivedStatus = false;
  let lastStatusError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let experience;
    try {
      experience = await pdfStatus(activeSession.sourceFile);
      receivedStatus = true;
      lastStatusError = null;
    } catch (error) {
      lastStatusError = error;
      if (attempt + 1 < maxAttempts) await delay(pollIntervalMs);
      continue;
    }

    if (experience?.id && experience.submitted_by === userId) {
      activeSession = {
        ...activeSession,
        experienceId: experience.id,
      };

      if (!activeSession.metadataAttached) {
        const updates = missingMetadata(activeSession.metadata, experience);
        if (Object.keys(updates).length > 0) {
          try {
            await patchExperience(experience.id, updates);
          } catch (error) {
            onSessionChange(activeSession);
            return { status: 'metadata_failed', session: activeSession, error };
          }
        }
        activeSession = { ...activeSession, metadataAttached: true };
      }
      onSessionChange(activeSession);

      if (experience.extraction_status === 'failed') {
        return { status: 'processing_failed', session: activeSession };
      }
      if (experience.extraction_status === 'completed') {
        return { status: 'completed', session: activeSession };
      }
    }

    if (attempt + 1 < maxAttempts) await delay(pollIntervalMs);
  }

  if (!receivedStatus && lastStatusError) {
    return {
      status: 'status_unavailable',
      session: activeSession,
      error: lastStatusError,
    };
  }

  return { status: 'pending', session: activeSession };
}
