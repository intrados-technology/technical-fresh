/* ============================================================
   INTRADOS DESIGN STUDIO – Candidate Assessment Portal
   script.js – Complete Application Logic
   ============================================================ */

'use strict';

// ── Google Sheets integration endpoint (replace with your URL) ──
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxteJu1b_okEFYv4jbSF4Ne55bOfBsyIiIx3tnAVHq833I1f7c7aGcn7VVck--VI_a8tg/exec";
const ASSESSMENT_TYPE =
  document.querySelector('meta[name="assessment-type"]')?.content || 'Technical';

// ── General Assessment sheet (source for Reference ID lookup) ────
// Candidate details (Name, Mobile, Email, Position) are pulled live
// from the "General Assessment" tab using the Reference ID the
// candidate enters here — no need to re-type their details.
// Columns in that tab: B = Reference ID, C = Name, D = Mobile,
// E = Email, F = Position, K = Recommendation.
// Only candidates rated "Borderline" or above in the General
// Assessment (Borderline / Hire / Strong Hire / Exceptional) are
// eligible to take this Technical Assessment. "Reject" or an
// unmatched Reference ID both surface the same message to the
// candidate so no scoring detail is ever revealed to them.
const GENERAL_SHEET_ID  = "1Ep0ESBJb-QxzBfN2oxIAH0RFJOPvCsNb4NpvmyWOfDA";
const GENERAL_SHEET_TAB = "General Assessment";
const TECHNICAL_SHEET_TAB = "Professional Assessment"; // same spreadsheet, different tab — used to block repeat attempts; shared with the Non-Technical (HR) assessment
// "Rejection Overridden" is a manual status the backend/HR team can set
// directly in the General Assessment sheet (column K) to let a
// previously-Rejected candidate appear for the Technical Assessment anyway.
const ELIGIBLE_RATINGS  = ["borderline", "hire", "strong hire", "exceptional", "rejection overridden"];
const NOT_ELIGIBLE_MSG  = "You are not eligible for this test.";

// This portal only accepts candidates who registered under the
// "Fresher" track on the General Assessment. Prevents an
// Experienced candidate from taking the (typically easier) Freshers
// Technical Assessment to game their score, and vice versa.
const PORTAL_TRACK      = "Fresher";
const PORTAL_DOMAIN     = "Technical"; // both Technical portals (Experience & Freshers) share this domain value

// ── Multi-Tab Protection ────────────────────────────────────────
// Each tab gets a unique ID. When an assessment starts, that ID is
// stored in localStorage('assessmentTab'). Any other tab that loads
// and finds a DIFFERENT tab ID already stored is blocked immediately.
const TAB_ID = Date.now().toString();

(function enforceTabOwnership() {
  const runningTab = localStorage.getItem('assessmentTab');
  if (
    localStorage.getItem('assessmentRunning') === 'true' &&
    runningTab &&
    runningTab !== TAB_ID
  ) {
    // Another tab owns this session — block this tab completely
    document.body.innerHTML = `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        min-height:100vh;
        font-family:Arial,sans-serif;
        background:#f8f5ff;
        text-align:center;
        padding:40px 20px;
      ">
        <div style="
          background:#fff;
          border:1.5px solid #ddd6fe;
          border-radius:20px;
          padding:48px 40px;
          max-width:440px;
          box-shadow:0 8px 32px rgba(108,63,197,0.12);
        ">
          <div style="font-size:48px;margin-bottom:16px;">🔒</div>
          <h2 style="color:#4E2E9A;margin:0 0 12px;font-size:22px;">
            Assessment Already Running
          </h2>
          <p style="color:#4B5563;line-height:1.6;margin:0 0 20px;">
            An active assessment session was detected in another tab.<br/>
            Please return to the original tab to continue.
          </p>
          <p style="color:#9CA3AF;font-size:12px;margin:0;">
            If you believe this is an error, close all tabs and reload.
          </p>
        </div>
      </div>`;
    throw new Error('IDS: Assessment already running in another tab. Tab blocked.');
  }
})();

// ── App State ───────────────────────────────────────────────────
const state = {
  candidate: {},       // Registration data
  answers:   {},       // { questionIndex: selectedOptionIndex }
  currentQ:  0,        // 0-based current question index
  timerSecs: 30 * 60, // 30 minutes in seconds
  timerRef:  null,     // setInterval reference
  submitted: false,    // Guard against double-submission
  integrityFlags: []   // Logged proctoring events (tab switches, fullscreen exits, etc.)
};

// ── Restore saved answers on page load ──────────────────────────
try {
  const savedAnswers = localStorage.getItem('ids_answers');
  if (savedAnswers) {
    state.answers = JSON.parse(savedAnswers);
  }
} catch(e) {
  console.warn('Unable to restore saved answers');
}

// ── DOM References ──────────────────────────────────────────────
const DOM = {
  regSection:     document.getElementById('registration-section'),
  assSection:     document.getElementById('assessment-section'),
  confSection:    document.getElementById('confirmation-section'),
  timerDisplay:   document.getElementById('timer-display'),
  timerText:      document.getElementById('timer-text'),

  formRefId:      document.getElementById('field-refid'),
  errRefId:       document.getElementById('err-refid'),
  btnVerify:      document.getElementById('btn-verify'),
  btnStart:       document.getElementById('btn-start'),
  candSummary:    document.getElementById('candidate-summary'),
  summaryName:    document.getElementById('summary-name'),
  summaryMobile:  document.getElementById('summary-mobile'),
  summaryEmail:   document.getElementById('summary-email'),
  summaryPosition:document.getElementById('summary-position'),

  progressFill:   document.getElementById('progress-fill'),
  progressLabel:  document.getElementById('progress-label'),
  progressCount:  document.getElementById('progress-count'),
  sectionStrip:   document.getElementById('section-strip'),
  questionWrap:   document.getElementById('question-wrap'),
  btnNext:        document.getElementById('btn-next'),
  btnSubmit:      document.getElementById('btn-submit'),
  unansweredHint: document.getElementById('unanswered-hint'),

  modal:          document.getElementById('submit-modal'),
  modalMsg:       document.getElementById('modal-unanswered-count'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalConfirm:document.getElementById('btn-modal-confirm'),

  neModal:        document.getElementById('not-eligible-modal'),
  neModalDesc:    document.getElementById('not-eligible-desc'),
  btnNeModalOk:   document.getElementById('btn-not-eligible-ok'),

  webcamModal:      document.getElementById('webcam-consent-modal'),
  btnWebcamAllow:   document.getElementById('btn-webcam-allow'),
  btnWebcamDecline: document.getElementById('btn-webcam-decline'),

  rulesModal:         document.getElementById('rules-modal'),
  btnRulesUnderstood: document.getElementById('btn-rules-understood'),

};

// ── Exam Rules Modal ──────────────────────────────────────────────
// Shown automatically on page load, before the candidate can see or
// interact with the Reference ID / registration form. No skip/close-
// by-backdrop — the only way past it is the explicit button click.
DOM.btnRulesUnderstood.addEventListener('click', function() {
  DOM.rulesModal.classList.remove('open');
});

// ── Security ─────────────────────────────────────────────────────
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
  if (e.key === 'F12') { e.preventDefault(); return false; }
  if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.ctrlKey && ['U','u','S','s'].includes(e.key)) { e.preventDefault(); return false; }
});
// ── Stale lock cleanup on tab close / crash ─────────────────────
// 'unload' fires even on crashes (best-effort). Clears the tab lock
// so a future session isn't blocked by a ghost lock.
window.addEventListener('unload', function() {
  if (!state.submitted) {
    localStorage.removeItem('assessmentRunning');
    localStorage.removeItem('assessmentTab');
  }
});

window.addEventListener('beforeunload', function(e) {
  if (!state.submitted && DOM.assSection.style.display === 'block') {
    e.preventDefault();
    e.returnValue = 'Your assessment is in progress. Are you sure you want to leave?';
    return e.returnValue;
  }
});

// ── Candidate Identity Corner ──────────────────────────────────────
// Populated from ?ref=&name= query params, passed along by
// Assessment-list when it sends the candidate here. Since we already
// know their Reference ID at this point (they already verified once
// on Assessment-list), we auto-run the verification immediately
// instead of making them click Verify again — same eligibility
// checks still run underneath, just triggered automatically.
(function initCandidateCorner() {
  const params = new URLSearchParams(window.location.search);
  const urlRefId = (params.get('ref')  || '').trim();
  const urlName  = (params.get('name') || '').trim();

  if (urlRefId && urlName) {
    document.getElementById('candidate-corner-name').textContent = urlName;
    document.getElementById('candidate-corner-ref').textContent  = urlRefId;
    document.getElementById('candidate-corner').style.display = 'flex';
  }

  if (urlRefId && DOM.formRefId) {
    DOM.formRefId.value = urlRefId;
    window.addEventListener('DOMContentLoaded', function() {
      verifyReferenceId();
    });
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      verifyReferenceId();
    }
  }
})();

// ── Reference ID Verification & Auto-Fill ─────────────────────────
// Candidate types their Reference ID from the General Assessment,
// clicks Verify, and two checks run in sequence before they're
// allowed to start:
//   1. Technical Assessment tab — has this Reference ID already
//      submitted a Technical attempt? If yes, block re-entry
//      regardless of what rating that attempt received.
//   2. General Assessment tab — is this Reference ID's Recommendation
//      Borderline or above? If not (or not found at all), block.
// Only if both checks pass do we pull Name/Mobile/Email/Position
// (columns B–F) and populate the candidate summary.
// Loaded via JSONP <script> tags since the gviz endpoint does not
// send CORS headers for fetch().

const ALREADY_ATTEMPTED_MSG = "You have already completed this assessment. Multiple attempts are not allowed.";

function setRefIdError(msg) {
  DOM.formRefId.classList.toggle('error', !!msg);
  DOM.formRefId.classList.remove('success');
  DOM.errRefId.textContent = msg || '';
  DOM.errRefId.classList.toggle('show', !!msg);
}

function clearVerifiedCandidate() {
  state.candidate = {};
  DOM.candSummary.style.display = 'none';
  DOM.btnStart.disabled = true;
  DOM.formRefId.classList.remove('success');
}

function showNotEligibleModal(msg) {
  DOM.neModalDesc.textContent = msg;
  DOM.neModal.classList.add('open');
}
function hideNotEligibleModal() {
  DOM.neModal.classList.remove('open');
}
DOM.btnNeModalOk.addEventListener('click', hideNotEligibleModal);
DOM.neModal.addEventListener('click', function(e) {
  if (e.target === DOM.neModal) hideNotEligibleModal(); // click on backdrop closes it
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && DOM.neModal.classList.contains('open')) hideNotEligibleModal();
});

// Re-verification required any time the Reference ID is edited
DOM.formRefId.addEventListener('input', function() {
  clearVerifiedCandidate();
  hideNotEligibleModal();
});

// Generic one-shot gviz/tq JSONP fetch. Calls onSuccess(rows) or
// onFail(message). Handles its own timeout + <script> tag cleanup.
function gvizFetch(sheetId, sheetTab, query, onSuccess, onFail) {
  const callbackName = 'idsGvizCallback_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  let settled = false;

  const cleanup = function() {
    delete window[callbackName];
    const tag = document.getElementById(callbackName);
    if (tag) tag.remove();
    clearTimeout(timeoutRef);
  };

  const timeoutRef = setTimeout(function() {
    if (settled) return;
    settled = true;
    cleanup();
    onFail('Could not reach the verification service. Check your connection and try again.');
  }, 12000);

  window[callbackName] = function(response) {
    if (settled) return;
    settled = true;
    cleanup();
    try {
      onSuccess(response.table.rows || []);
    } catch (err) {
      onFail('Something went wrong while verifying. Please try again.');
    }
  };

  const url =
    'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq' +
    '?sheet=' + encodeURIComponent(sheetTab) +
    '&tq=' + encodeURIComponent(query) +
    '&tqx=responseHandler:' + callbackName;

  const script = document.createElement('script');
  script.id = callbackName;
  script.src = url;
  script.onerror = function() {
    if (settled) return;
    settled = true;
    cleanup();
    onFail('Could not verify right now. Please try again in a moment.');
  };
  document.body.appendChild(script);
}

function verifyReferenceId() {
  const refId = DOM.formRefId.value.trim();
  setRefIdError('');
  clearVerifiedCandidate();

  if (!refId) {
    setRefIdError('Please enter your Reference ID.');
    return;
  }

  DOM.btnVerify.disabled = true;
  DOM.btnVerify.textContent = 'Verifying…';

  const finish = function(errMsg) {
    DOM.btnVerify.disabled = false;
    DOM.btnVerify.textContent = 'Verify';
    if (errMsg) {
      setRefIdError(errMsg);
      showNotEligibleModal(errMsg);
    }
  };

  const safeRefId = refId.replace(/'/g, "\\'");

  // ── Step 1: has this Reference ID already submitted a Technical
  // Assessment attempt? ────────────────────────────────────────────
  gvizFetch(
    GENERAL_SHEET_ID,
    TECHNICAL_SHEET_TAB,
    "select B where B = '" + safeRefId + "'",
    function(techRows) {
      if (techRows.length > 0) {
        finish(ALREADY_ATTEMPTED_MSG);
        return;
      }
      runEligibilityCheck();
    },
  );

  // ── Step 2: is this Reference ID Borderline-and-above in the
  // General Assessment? ────────────────────────────────────────────
  function runEligibilityCheck() {
    gvizFetch(
      GENERAL_SHEET_ID,
      GENERAL_SHEET_TAB,
      "select B,C,D,E,F,K,M,N where B = '" + safeRefId + "'",
      function(genRows) {
        if (genRows.length === 0) {
          finish(NOT_ELIGIBLE_MSG);
          return;
        }

        const cells = genRows[0].c;
        const name           = cells[1] && cells[1].v ? String(cells[1].v).trim() : '';
        const mobile         = cells[2] && cells[2].v ? String(cells[2].v).trim() : '';
        const email          = cells[3] && cells[3].v ? String(cells[3].v).trim() : '';
        const position       = cells[4] && cells[4].v ? String(cells[4].v).trim() : '';
        const recommendation = cells[5] && cells[5].v ? String(cells[5].v).trim() : '';
        const track           = cells[6] && cells[6].v ? String(cells[6].v).trim() : '';
        const domain          = cells[7] && cells[7].v ? String(cells[7].v).trim() : '';

        if (!name) {
          finish(NOT_ELIGIBLE_MSG);
          return;
        }

        // Only Borderline-and-above candidates from the General Assessment
        // are allowed to proceed. Reject / unrecognised ratings get the
        // same generic message as an unmatched Reference ID.
        const isEligible = ELIGIBLE_RATINGS.indexOf(recommendation.toLowerCase()) !== -1;
        if (!isEligible) {
          finish(NOT_ELIGIBLE_MSG);
          return;
        }

        // Block Non-Technical candidates from taking the Technical
        // Assessment (and vice versa) — a candidate's registered Domain
        // must be "Technical" to proceed here.
        if (domain.toLowerCase() !== 'technical') {
          finish(NOT_ELIGIBLE_MSG);
          return;
        }

        // Block cross-track attempts: an Experienced candidate trying the
        // Freshers Technical Assessment (or vice versa) to game an easier
        // paper. The candidate's own registered track must match this portal.
        if (track.toLowerCase() !== PORTAL_TRACK.toLowerCase()) {
          finish(NOT_ELIGIBLE_MSG);
          return;
        }

        state.candidate = { name, mobile, email, position, refId };

        DOM.summaryName.textContent     = name;
        DOM.summaryMobile.textContent   = mobile || '—';
        DOM.summaryEmail.textContent    = email || '—';
        DOM.summaryPosition.textContent = position || '—';
        DOM.candSummary.style.display   = 'block';
        DOM.formRefId.classList.add('success');
        DOM.btnStart.disabled = false;
        finish(null);
      },
    );
  }
}

DOM.btnVerify.addEventListener('click', verifyReferenceId);
DOM.formRefId.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') { e.preventDefault(); verifyReferenceId(); }
});

// ── Test Integrity Measures ─────────────────────────────────────
// Active only while the assessment section is actually on screen.
// None of this can stop someone photographing the screen with a
// second physical device — that's outside what any web page can
// see or control. What this DOES do: block the easy same-device
// methods (copy-paste, opening a new tab to an AI tool, using the
// back button to escape), and log signals (fullscreen exits, tab
// switches) so flagged attempts can be manually reviewed rather
// than trusted blindly.
let integrityArmed = false;

function logIntegrityFlag(msg) {
  const ts = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  state.integrityFlags.push('[' + ts + ', Q' + (state.currentQ + 1) + '] ' + msg);
}

function handleFullscreenChange() {
  if (!integrityArmed) return;
  const inFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!inFullscreen) {
    logIntegrityFlag('Exited fullscreen — assessment auto-submitted');
    autoSubmitDueToViolation();
  }
}

function handleVisibilityChange() {
  if (!integrityArmed) return;
  if (document.hidden) {
    logIntegrityFlag('Tab/window switched away — assessment auto-submitted');
    autoSubmitDueToViolation();
  }
}

function handlePopState() {
  if (!integrityArmed) return;
  history.pushState(null, '', location.href); // immediately cancel the back navigation
  logIntegrityFlag('Attempted to navigate back');
}

function blockCopyAndContextMenu(e) {
  if (integrityArmed) e.preventDefault();
}

function requestFullscreenSafe() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req) { try { req.call(el); } catch(e) {} }
}

// ── Second-Monitor Detection ────────────────────────────────────
// screen.isExtended (Window Management API) currently only works in
// Chromium browsers (Chrome, Edge) — Safari and Firefox always report
// false, so this provides NO protection on those browsers. Best-effort
// only; feature-detected so it never errors where unsupported.
function hasSecondMonitor() {
  return ('isExtended' in screen) && screen.isExtended === true;
}

function handleScreenChange() {
  if (!integrityArmed) return;
  if (hasSecondMonitor()) {
    logIntegrityFlag('Second monitor connected during assessment — auto-submitted');
    autoSubmitDueToViolation();
  }
}

function armIntegrityMeasures() {
  integrityArmed = true;
  requestFullscreenSafe();
  history.pushState(null, '', location.href);
  window.addEventListener('popstate', handlePopState);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('contextmenu', blockCopyAndContextMenu);
  document.addEventListener('copy', blockCopyAndContextMenu);
  document.addEventListener('cut', blockCopyAndContextMenu);
  if ('isExtended' in screen) {
    try { screen.addEventListener('change', handleScreenChange); } catch(e) {}
  }
}

function disarmIntegrityMeasures() {
  integrityArmed = false;
  window.removeEventListener('popstate', handlePopState);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  document.removeEventListener('contextmenu', blockCopyAndContextMenu);
  document.removeEventListener('copy', blockCopyAndContextMenu);
  document.removeEventListener('cut', blockCopyAndContextMenu);
  if ('isExtended' in screen) {
    try { screen.removeEventListener('change', handleScreenChange); } catch(e) {}
  }
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch(e) {}
  }
}

function autoSubmitDueToViolation() {
  if (state.submitted) return;
  finaliseSubmission();
}

// ── Webcam Recording ─────────────────────────────────────────────
// Consent is asked explicitly before any camera access — nothing
// records silently. Once granted, recording runs for the full
// assessment and uploads in ~30-second chunks to Google Drive via
// the Apps Script backend (action: 'webcamChunk'), saved into a
// folder named "<ReferenceID>_<TEST_TYPE>". Chunked upload (rather
// than one file at the end) means a crash or connection drop still
// leaves whatever was recorded safely saved, and keeps each
// individual upload small. This covers EVERY submission path —
// normal finish, tab-switch, fullscreen-exit, second-monitor — since
// stopWebcamRecording() is called from finaliseSubmission() itself,
// which all of those funnel into.
const TEST_TYPE = 'P'; // 'G' for General Assessment, 'P' for all Professional Assessment portals
let mediaStream   = null;
let mediaRecorder = null;
let webcamChunkIndex = 0;

function showWebcamConsent() {
  return new Promise(function(resolve) {
    DOM.webcamModal.classList.add('open');
    DOM.btnWebcamAllow.onclick = function() {
      DOM.webcamModal.classList.remove('open');
      resolve(true);
    };
    DOM.btnWebcamDecline.onclick = function() {
      DOM.webcamModal.classList.remove('open');
      resolve(false);
    };
  });
}

async function startWebcamRecording() {
  console.log('[IDS-WEBCAM-DEBUG] startWebcamRecording() called');
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240 },
      audio: false
    });
    console.log('[IDS-WEBCAM-DEBUG] getUserMedia succeeded, stream tracks:', mediaStream.getTracks().length);
  } catch (err) {
    console.log('[IDS-WEBCAM-DEBUG] getUserMedia FAILED:', err.name, err.message);
    return false;
  }
  try {
    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 150000
    });
    console.log('[IDS-WEBCAM-DEBUG] MediaRecorder created with vp8, state:', mediaRecorder.state);
  } catch (err) {
    console.log('[IDS-WEBCAM-DEBUG] vp8 MediaRecorder failed, trying fallback:', err.message);
    try {
      mediaRecorder = new MediaRecorder(mediaStream);
      console.log('[IDS-WEBCAM-DEBUG] fallback MediaRecorder created, state:', mediaRecorder.state);
    }
    catch (err2) {
      console.log('[IDS-WEBCAM-DEBUG] fallback MediaRecorder ALSO FAILED:', err2.message);
      return false;
    }
  }
  webcamChunkIndex = 0;
  mediaRecorder.ondataavailable = function(e) {
    console.log('[IDS-WEBCAM-DEBUG] ondataavailable fired, blob size:', e.data ? e.data.size : 'no data');
    if (e.data && e.data.size > 0) {
      uploadWebcamChunk(e.data, webcamChunkIndex);
      webcamChunkIndex++;
    }
  };
  try {
    mediaRecorder.start(30000);
    console.log('[IDS-WEBCAM-DEBUG] mediaRecorder.start(30000) called successfully, state:', mediaRecorder.state);
  } catch(e) {
    console.log('[IDS-WEBCAM-DEBUG] mediaRecorder.start() FAILED:', e.message);
    return false;
  }
  return true;
}

function stopWebcamRecording() {
  console.log('[IDS-WEBCAM-DEBUG] stopWebcamRecording() called, recorder state:', mediaRecorder ? mediaRecorder.state : 'no recorder');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); console.log('[IDS-WEBCAM-DEBUG] mediaRecorder.stop() called'); } catch(e) { console.log('[IDS-WEBCAM-DEBUG] stop() error:', e.message); }
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(function(t) { t.stop(); });
    console.log('[IDS-WEBCAM-DEBUG] media tracks stopped');
  }
}

function uploadWebcamChunk(blob, index) {
  console.log('[IDS-WEBCAM-DEBUG] uploadWebcamChunk() called for chunk', index, 'size:', blob.size);
  var reader = new FileReader();
  reader.onloadend = function() {
    var base64 = reader.result.split(',')[1];
    console.log('[IDS-WEBCAM-DEBUG] base64 encoded, length:', base64.length, '— sending fetch now');
    fetch(SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:      'webcamChunk',
        referenceId: (state.candidate && state.candidate.refId) || 'unknown',
        testType:    TEST_TYPE,
        chunkIndex:  index,
        mimeType:    blob.type,
        data:        base64
      })
    }).then(function() {
      console.log('[IDS-WEBCAM-DEBUG] fetch() completed (no-cors — response is always opaque, this only confirms no network-level throw)');
    }).catch(function(err) { console.log('[IDS-WEBCAM-DEBUG] fetch() THREW:', err.message); });
  };
  reader.onerror = function(err) {
    console.log('[IDS-WEBCAM-DEBUG] FileReader error:', err);
  };
  reader.readAsDataURL(blob);
}

// ── Start Assessment ─────────────────────────────────────────────
DOM.btnStart.addEventListener('click', async function() {
  // Candidate details were already populated by verifyReferenceId();
  // guard here in case the button was somehow enabled without a match.
  if (!state.candidate || !state.candidate.name) {
    setRefIdError('Please verify your Reference ID before starting.');
    return;
  }

  if (hasSecondMonitor()) {
    alert('A second monitor/display was detected. Please disconnect any secondary displays and refresh the page before starting this assessment.');
    return;
  }

  const consented = await showWebcamConsent();
  if (!consented) {
    alert('Webcam recording is required to begin this assessment.');
    return;
  }
  const recordingStarted = await startWebcamRecording();
  if (!recordingStarted) {
    alert('Could not access your webcam. Please allow camera access in your browser and try again.');
    return;
  }

  DOM.regSection.style.display   = 'none';
  DOM.assSection.style.display   = 'block';
  DOM.timerDisplay.style.display = 'flex';
  // Mark this tab as the authoritative assessment session
  localStorage.setItem('assessmentRunning', 'true');
  localStorage.setItem('assessmentTab', TAB_ID);
  armIntegrityMeasures();
  // Resume from the last answered question if answers were restored
  const lastAnswered = Object.keys(state.answers).length;
  renderQuestion(lastAnswered > 0 ? lastAnswered : 0);
  startTimer();
});

// ── Timer ─────────────────────────────────────────────────────────
function formatTime(s) {
  return String(Math.floor(s / 60)).padStart(2,'0') + ':' + String(s % 60).padStart(2,'0');
}

function startTimer() {
  DOM.timerText.textContent = formatTime(state.timerSecs);
  state.timerRef = setInterval(function() {
    state.timerSecs--;
    DOM.timerText.textContent = formatTime(state.timerSecs);
    if (state.timerSecs <= 0) {
      clearInterval(state.timerRef);
      if (!state.submitted) finaliseSubmission();
    } else if (state.timerSecs <= 60) {
      DOM.timerDisplay.classList.remove('warning');
      DOM.timerDisplay.classList.add('danger');
    } else if (state.timerSecs <= 300) {
      DOM.timerDisplay.classList.add('warning');
    }
  }, 1000);
}

// ── Answer Selection via Event Delegation ────────────────────────
// ONE listener on the stable parent — never removed, never duplicated.
// Reads clicks on .option-label children directly.
DOM.questionWrap.addEventListener('click', function(e) {
  const label = e.target.closest('.option-label');
  if (!label) return;

  const optionIndex = parseInt(label.getAttribute('data-option'), 10);
  if (isNaN(optionIndex)) return;

  // Save answer
  state.answers[state.currentQ] = optionIndex;
  // Persist answers to localStorage on every selection
  localStorage.setItem('ids_answers', JSON.stringify(state.answers));

  // Update visual selection — remove from all, add to clicked
  DOM.questionWrap.querySelectorAll('.option-label').forEach(function(l) {
    l.classList.remove('selected');
    l.setAttribute('aria-checked', 'false');
  });
  label.classList.add('selected');
  label.setAttribute('aria-checked', 'true');

  // Clear the unanswered warning now that a selection exists
  DOM.unansweredHint.classList.remove('show');
});

// ── Question Rendering ───────────────────────────────────────────
function renderQuestion(index) {
  state.currentQ = index;
  const q = SHUFFLED_QUESTIONS[index];
  const savedAnswer = state.answers[index]; // may be undefined

  // Progress
  const pct = Math.round(((index + 1) / SHUFFLED_QUESTIONS.length) * 100);
  DOM.progressFill.style.width      = pct + '%';
  DOM.progressLabel.textContent     = 'Question ' + (index + 1) + ' of ' + SHUFFLED_QUESTIONS.length;
  DOM.progressCount.textContent     = pct + '% Complete';
  DOM.sectionStrip.textContent      = 'Section ' + q.section + ': ' + q.sectionLabel;

  // Build options as <button> elements — natively clickable on all
  // browsers/devices regardless of user-select:none on the body.
  const optionsHTML = q.options.map(function(opt, i) {
    const isSelected = (savedAnswer === i);
    return '<li class="option-item">' +
      '<button class="option-label' + (isSelected ? ' selected' : '') + '" data-option="' + i + '" type="button" role="radio" aria-checked="' + isSelected + '">' +
        '<span class="option-indicator"></span>' +
        '<span class="option-text">' + escapeHTML(opt) + '</span>' +
      '</button>' +
    '</li>';
  }).join('');

  DOM.questionWrap.innerHTML =
    '<div class="question-card">' +
      '<div class="question-number">Q' + (index + 1) + '</div>' +
      '<p class="question-text">' + escapeHTML(q.text) + '</p>' +
      (q.image ? '<div class="question-image-wrap"><img src="' + escapeHTML(q.image) + '" alt="Question ' + (index + 1) + ' diagram" class="question-image" /></div>' : '') +
      '<ul class="options-list" role="radiogroup" aria-label="Answer options">' +
        optionsHTML +
      '</ul>' +
    '</div>';

  // Buttons handle Enter natively; add Space for radio-group UX
  DOM.questionWrap.querySelectorAll('.option-label').forEach(function(btn) {
    btn.addEventListener('keydown', function(e) {
      if (e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

  // Nav button states
  const isLast                    = (index === SHUFFLED_QUESTIONS.length - 1);
  DOM.btnNext.style.display       = isLast ? 'none'        : 'inline-flex';
  DOM.btnSubmit.style.display     = isLast ? 'inline-flex' : 'none';

  // Reset warning state on every fresh render
  DOM.unansweredHint.classList.remove('show');
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Navigation ───────────────────────────────────────────────────
DOM.btnNext.addEventListener('click', function() {
  if (state.currentQ < SHUFFLED_QUESTIONS.length - 1) renderQuestion(state.currentQ + 1);
});


















// ── Submit ───────────────────────────────────────────────────────
DOM.btnSubmit.addEventListener('click', function() {
  const unanswered = SHUFFLED_QUESTIONS.length - Object.keys(state.answers).length;
  DOM.modalMsg.textContent = unanswered > 0
    ? 'You have ' + unanswered + ' unanswered question' + (unanswered > 1 ? 's' : '') + '.'
    : 'All questions answered. Ready to submit?';
  DOM.modal.classList.add('open');
});

DOM.btnModalCancel.addEventListener('click',  () => DOM.modal.classList.remove('open'));
DOM.btnModalConfirm.addEventListener('click', function() {
  DOM.modal.classList.remove('open');
  finaliseSubmission();
});

// ── Scoring ──────────────────────────────────────────────────────
function calculateScores() {
  var totalScore = 0;

  SHUFFLED_QUESTIONS.forEach(function(q, i) {
    var chosen = state.answers[i];
    if (chosen === undefined) return;
    if (chosen === q.correctIndex) {
      totalScore += q.marks;
    }
  });

  var rating =
    totalScore >= 27 ? 'Exceptional'    :
    totalScore >= 23 ? 'Strong Hire'    :
    totalScore >= 18 ? 'Hire'           :
    totalScore >= 14 ? 'Borderline'     : 'Not Recommended';

  return { totalScore, rating, referenceId: state.candidate.refId || '' };
}

// ── Final Submission ─────────────────────────────────────────────
function finaliseSubmission() {
  if (state.submitted) return;
  state.submitted = true;
  if (state.timerRef) clearInterval(state.timerRef);
  disarmIntegrityMeasures();
  stopWebcamRecording();

  var scores  = calculateScores();
  var subTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  var hrRecord = {
    referenceId:    scores.referenceId,
    name:           state.candidate.name,
    mobile:         state.candidate.mobile,
    email:          state.candidate.email,
    position:       state.candidate.position,
    candidateRefId: state.candidate.refId,
    domain:         PORTAL_DOMAIN,
    totalScore:     scores.totalScore,
    maxScore:       30,
    rating:         scores.rating,
    submissionTime: subTime,
    integrityNotes: state.integrityFlags.join(' | '),
    answers:        state.answers
  };

  try { sessionStorage.setItem('ids_hr_record', JSON.stringify(hrRecord)); } catch(e) {}
  submitToGoogleSheet(hrRecord);
  // Clear all localStorage session flags on completion
  localStorage.removeItem('assessmentRunning');
  localStorage.removeItem('assessmentTab');
  localStorage.removeItem('ids_answers');

  DOM.assSection.style.display   = 'none';
  DOM.timerDisplay.style.display = 'none';
  DOM.confSection.style.display  = 'block';
}

// ── Google Sheets ─────────────────────────────────────────────────
async function submitToGoogleSheet(record) {
  if (!SCRIPT_URL || SCRIPT_URL === 'PASTE_GOOGLE_APPS_SCRIPT_URL_HERE') return;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetName:      'Professional Assessment',
        referenceId:    record.referenceId,
        name:           record.name,
        mobile:         record.mobile,
        email:          record.email,
        position:       record.position,
        domain:         record.domain,
        totalScore:     record.totalScore,
        maxScore:       record.maxScore,
        rating:         record.rating,
        submissionTime: record.submissionTime,
        integrityNotes: record.integrityNotes
      })
    });
  } catch(err) { console.warn('[IDS] Sheets error:', err); }
}

// ── PDF Report (HR only) ──────────────────────────────────────────
function generatePDFReport() {
  var record;
  try { record = JSON.parse(sessionStorage.getItem('ids_hr_record')); } catch(e) { record = null; }
  if (!record) { alert('No submission data found in this session.'); return; }

  var rows = SHUFFLED_QUESTIONS.map(function(q, i) {
    var chosen  = record.answers[i];
    var ans     = (chosen !== undefined) ? q.options[chosen] : '— Not answered —';
    var correct = q.options[q.correctIndex];
    var mark    = (chosen !== undefined && chosen === q.correctIndex) ? '✓' : '✗';
    var color   = (mark === '✓') ? '#16a34a' : '#dc2626';
    return '<tr>' +
      '<td>' + q.id + '</td>' +
      '<td>Section ' + q.section + '</td>' +
      '<td>' + q.text + '</td>' +
      '<td>' + ans + '</td>' +
      '<td>' + correct + '</td>' +
      '<td style="text-align:center;font-weight:bold;color:' + color + '">' + mark + '</td>' +
    '</tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Technical Assessment Report – ' + record.name + '</title>' +
    '<style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h1{color:#6C3FC5}h2{color:#4E2E9A;margin:18px 0 8px}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#6C3FC5;color:#fff;padding:7px 10px;text-align:left}' +
    'td{padding:6px 10px;border-bottom:1px solid #ddd6fe;vertical-align:top}tr:nth-child(even) td{background:#f8f5ff}' +
    '.conf{color:#DC2626;font-size:10px;text-align:center;border-top:1px solid #ddd;padding-top:10px;margin-top:20px}</style></head><body>' +
    '<h1>INTRADOS DESIGN STUDIO</h1>' +
    '<p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Technical Assessment Report – HR Confidential</p>' +
    '<h2>Candidate Details</h2><table>' +
    '<tr><th>Field</th><th>Value</th></tr>' +
    '<tr><td>Reference ID</td><td>' + record.referenceId + '</td></tr>' +
    '<tr><td>Name</td><td>' + record.name + '</td></tr>' +
    '<tr><td>Mobile</td><td>' + record.mobile + '</td></tr>' +
    '<tr><td>Email</td><td>' + record.email + '</td></tr>' +
    '<tr><td>Position Applied</td><td>' + record.position + '</td></tr>' +
    '<tr><td>Reference ID (Candidate)</td><td>' + (record.candidateRefId || '—') + '</td></tr>' +
    '<tr><td>Submitted</td><td>' + record.submissionTime + '</td></tr></table>' +
    '<h2>Result Summary</h2><table>' +
    '<tr><th>Metric</th><th>Value</th></tr>' +
    '<tr><td>Total Score</td><td><strong>' + record.totalScore + ' / 30</strong></td></tr>' +
    '<tr><td>Rating</td><td><strong>' + record.rating + '</strong></td></tr></table>' +
    '<h2>All Responses</h2><table>' +
    '<tr><th>#</th><th>Section</th><th>Question</th><th>Candidate Answer</th><th>Correct Answer</th><th style="text-align:center">Result</th></tr>' +
    rows + '</table>' +
    '<p class="conf">CONFIDENTIAL – FOR HR USE ONLY</p></body></html>';

  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(function() { win.print(); }, 500);
}

window.generatePDFReport = generatePDFReport;