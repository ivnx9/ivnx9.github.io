/*
 * Main JavaScript for Exam Miner UI
 *
 * Handles navigation between dashboard sections, file uploads, exam
 * generation via the provided AI API, formatting toolbar actions, PDF
 * and DOCX downloads, and a simple profile settings modal. This
 * script is intentionally modular and declarative, grouping related
 * functionality into separate functions for clarity.
 */

(function () {
  // Global state for generated exams
  const exams = [];

  /**
   * Utility to select DOM elements
   * @param {string} selector
   * @returns {Element}
   */
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  /**
   * Dashboard initialisation: registers event listeners and sets default
   * section visibility. Only executes if dashboard elements are present.
   */
  function initDashboard() {
    const navDashboard = $('#navDashboard');
    const navGenerate = $('#navGenerate');
    const navMyExams = $('#navMyExams');
    const dashboardPage = $('#dashboardPage');
    const generatePage = $('#generatePage');
    const myExamsPage = $('#myExamsPage');
    const goGenerateBtn = $('#goGenerateBtn');
    const viewExamsBtn = $('#viewExamsBtn');
    const recentExamsTableBody = $('#recentExamsTable tbody');
    const myExamsTableBody = $('#myExamsTable tbody');

    // Section switcher helper
    function showSection(section) {
      [dashboardPage, generatePage, myExamsPage].forEach((s) => s.classList.add('hidden'));
      section.classList.remove('hidden');
    }

    function setActiveNav(button) {
      [navDashboard, navGenerate, navMyExams].forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
    }

    // Navigation events
    navDashboard?.addEventListener('click', () => {
      setActiveNav(navDashboard);
      showSection(dashboardPage);
    });
    navGenerate?.addEventListener('click', () => {
      setActiveNav(navGenerate);
      showSection(generatePage);
    });
    navMyExams?.addEventListener('click', () => {
      setActiveNav(navMyExams);
      showSection(myExamsPage);
    });
    goGenerateBtn?.addEventListener('click', () => {
      setActiveNav(navGenerate);
      showSection(generatePage);
    });
    viewExamsBtn?.addEventListener('click', () => {
      setActiveNav(navMyExams);
      showSection(myExamsPage);
    });

    // Drag and drop area handling
    const dropArea = $('#dropArea');
    const materialInput = $('#material');
    dropArea.addEventListener('click', () => materialInput.click());
    ['dragenter', 'dragover'].forEach((ev) => {
      dropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragging');
      });
    });
    ['dragleave', 'drop'].forEach((ev) => {
      dropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragging');
      });
    });
    dropArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length) {
        // Assign the dropped files to the hidden input so subsequent
        // form logic works correctly
        materialInput.files = files;
        // Trigger change event so the UI reflects the selected file
        materialInput.dispatchEvent(new Event('change'));
      }
    });

    // Elements for the multi‑state generate exam flow
    const generateForm = $('#generateForm');
    const loadingScreen = $('#loadingScreen');
    const loadingMessage = $('#loadingMessage');
    const previewPage = $('#previewPage');
    const previewOutput = $('#previewOutput');
    const editorPage = $('#editorPage');
    const tryAgainBtn = $('#tryAgainBtn');
    const continueBtn = $('#continueBtn');
    const saveExamBtn = $('#saveExamBtn');
    const examsTable = myExamsTableBody; // alias

    // Update drop area message when file selected
    const dropMessage = $('#dropMessage');
    materialInput.addEventListener('change', () => {
      if (materialInput.files && materialInput.files[0]) {
        // Show the selected file name to the user
        dropMessage.innerHTML = `<strong>${materialInput.files[0].name}</strong> selected`;
      } else {
        // Restore original instructions when no file is selected
        dropMessage.innerHTML = 'Drag and drop a file here, or click to browse<br><small>Supported docx, ppt, pdf</small>';
      }
    });

    // Formatting toolbar actions
    const toolbar = $('#editorToolbar');
    const output = $('#output');
    toolbar?.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const command = target.dataset.command;
      if (command) {
        document.execCommand(command, false, null);
      }
    });
    // Font size selection
    const fontSizePicker = $('#fontSizePicker');
    fontSizePicker?.addEventListener('change', () => {
      const size = fontSizePicker.value;
      if (size) {
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.textContent = window.getSelection().toString();
        const range = window.getSelection().getRangeAt(0);
        range.deleteContents();
        range.insertNode(span);
      }
    });
    // Copy to clipboard
    const copyClipboardBtn = $('#copyClipboard');
    copyClipboardBtn?.addEventListener('click', () => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(output);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      alert('Copied to clipboard!');
    });

    // Generate exam flow
    const generateBtn = $('#generateBtn');
    generateBtn?.addEventListener('click', async () => {
      // Validate file
      const file = materialInput.files[0];
      if (!file) {
        alert('Please upload a learning material file.');
        return;
      }
      // Validate exam types
      const selectedTypes = Array.from(document.querySelectorAll('.format:checked')).map((cb) => cb.value);
      if (selectedTypes.length === 0) {
        alert('Please select at least one exam type.');
        return;
      }
      // Hide the form and show loading
      generateForm.classList.add('hidden');
      loadingScreen.classList.remove('hidden');
      loadingMessage.textContent = 'Extracting content from file...';
      // Extract content from file
      const formData = new FormData();
      formData.append('file', file);
      try {
        const extractRes = await fetch('https://pymultiextractor.onrender.com/extract', {
          method: 'POST',
          body: formData
        });
        const extractData = await extractRes.json();
        const extractedContent = extractData.content;
        if (!extractedContent) {
          loadingScreen.classList.add('hidden');
          generateForm.classList.remove('hidden');
          alert('Failed to extract file content.');
          return;
        }
        // Summarize content
        loadingMessage.textContent = 'Summarizing content...';
        const cleanedContent = await summarizeContent(extractedContent);
        if (!cleanedContent) {
          loadingScreen.classList.add('hidden');
          generateForm.classList.remove('hidden');
          alert('Summarization failed.');
          return;
        }
        // Generate exam
        loadingMessage.textContent = 'Generating exam...';
        const prompt = buildPrompt(cleanedContent);
        const aiResponse = await sendToAI(prompt);
        loadingScreen.classList.add('hidden');
        const formatted = aiResponse || 'No response from AI.';
        // Render preview (without title heading) and store exam
        const examTitle = $('#titleMaterial').value || 'Untitled Exam';
        // Remove the title from content since user provides it
        const previewContent = formatted.trim();
        previewOutput.innerHTML = previewContent.replace(/\n/g, '<br>');
        previewPage.classList.remove('hidden');
        // Prepare exam object (store content as HTML)
        const exam = {
          title: examTitle,
          content: previewOutput.innerHTML,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };
        // Temporarily store exam for editing
        generatePage.currentExam = exam;
      } catch (e) {
        console.error(e);
        loadingScreen.classList.add('hidden');
        generateForm.classList.remove('hidden');
        alert('An error occurred while generating the exam.');
      }
    });

    // Try again: go back to upload form
    tryAgainBtn?.addEventListener('click', () => {
      previewPage.classList.add('hidden');
      generateForm.classList.remove('hidden');
      // Reset drop area message and clear file input
      materialInput.value = '';
      dropMessage.innerHTML = 'Drag and drop a file here, or click to browse<br><small>Supported docx, ppt, pdf</small>';
    });

    // Continue: move to editor
    continueBtn?.addEventListener('click', () => {
      previewPage.classList.add('hidden');
      editorPage.classList.remove('hidden');
      // Fill editor with the preview content
      output.innerHTML = previewOutput.innerHTML;
    });

    // Save exam: update list and reset to upload for next
    saveExamBtn?.addEventListener('click', () => {
      const exam = generatePage.currentExam;
      if (!exam) return;
      // Update exam content with edited output
      exam.content = output.innerHTML;
      exam.title = $('#titleMaterial').value || exam.title;
      // Add to list if not already present
      if (!exams.includes(exam)) {
        exams.push(exam);
      }
      updateDashboardSummary();
      updateRecentExams();
      updateMyExams();
      // Reset states and form for next generation
      editorPage.classList.add('hidden');
      generateForm.classList.remove('hidden');
      output.innerHTML = '';
      previewOutput.innerHTML = '';
      materialInput.value = '';
      dropMessage.innerHTML = 'Drag and drop a file here, or click to browse<br><small>Supported docx, ppt, pdf</small>';
      // Clear title and description fields
      $('#titleMaterial').value = '';
      $('#description').value = '';
    });

    // Update summary cards and tables
    function updateDashboardSummary() {
      $('#totalExams').textContent = exams.length.toString();
    }
    function updateRecentExams() {
      recentExamsTableBody.innerHTML = '';
      const recent = exams.slice(-3).reverse();
      recent.forEach((ex) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${ex.title}</td><td>${ex.date}</td>`;
        recentExamsTableBody.appendChild(tr);
      });
    }
    function updateMyExams() {
      myExamsTableBody.innerHTML = '';
      exams.forEach((ex, idx) => {
        const tr = document.createElement('tr');
        const tdTitle = document.createElement('td');
        tdTitle.textContent = ex.title;
        const tdDate = document.createElement('td');
        tdDate.textContent = ex.date;
        const tdActions = document.createElement('td');
        tdActions.classList.add('actions');
        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'btn btn-outline';
        pdfBtn.textContent = 'PDF';
        pdfBtn.addEventListener('click', () => {
          downloadPDF(ex);
        });
        const docxBtn = document.createElement('button');
        docxBtn.className = 'btn btn-outline';
        docxBtn.textContent = 'DOCX';
        docxBtn.addEventListener('click', () => {
          downloadDOCX(ex);
        });
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          // Switch to Generate page and open editor for this exam
          setActiveNav(navGenerate);
          showSection(generatePage);
          generateForm.classList.add('hidden');
          loadingScreen.classList.add('hidden');
          previewPage.classList.add('hidden');
          editorPage.classList.remove('hidden');
          // Populate fields with existing exam
          output.innerHTML = ex.content;
          $('#titleMaterial').value = ex.title;
          // Set current exam reference
          generatePage.currentExam = ex;
        });
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-outline';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this exam?')) {
            exams.splice(idx, 1);
            updateDashboardSummary();
            updateRecentExams();
            updateMyExams();
          }
        });
        tdActions.append(pdfBtn, docxBtn, editBtn, delBtn);
        tr.append(tdTitle, tdDate, tdActions);
        myExamsTableBody.appendChild(tr);
      });
    }

    // Export functions for download from My Exams table
    async function downloadPDF(exam) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const title = exam.title.toUpperCase();
      // Convert HTML line breaks to plain newlines and strip other tags
      const plainContent = exam.content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(plainContent, 180);
      let y = 30;
      const lineHeight = 6;
      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += lineHeight;
      });
      doc.save(`${title}.pdf`);
    }

    function downloadDOCX(exam) {
      /*
       * Build a DOCX from the exam HTML content. We wrap the
       * existing HTML into a complete document with styles so that
       * line breaks (<br>) are respected and the overall look and
       * feel matches the web editor (font, size, margins). The
       * exam title is added as an H1 element at the top. The rest of
       * the content is inserted as‑is to preserve bullets, lists and
       * line breaks. If you wish to convert <br> tags into separate
       * paragraphs, you can adjust the replacement below.
       */
      const title = exam.title || 'Exam Paper';
      // Preserve <br> tags; htmlDocx will convert them to line breaks
      const content = exam.content;
      const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset='utf-8'>
          <style>
            body { font-family: 'Inter', sans-serif; font-size: 12pt; line-height: 1.6; }
            h1 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 0.75rem; }
            p { margin: 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content}
        </body>
      </html>`;
      try {
        const blob = window.htmlDocx.asBlob(html);
        window.saveAs(blob, `${title}.docx`);
      } catch (err) {
        console.error(err);
        alert('Failed to export DOCX. Please ensure html-docx-js and FileSaver.js are loaded.');
      }
    }

    // Attach export functions to global scope for toolbar downloads
    window.downloadPDFCurrent = function () {
      const exam = { title: $('#titleMaterial').value || 'Exam Paper', content: output.innerHTML };
      downloadPDF(exam);
    };
    window.downloadDOCXCurrent = function () {
      const exam = { title: $('#titleMaterial').value || 'Exam Paper', content: output.innerHTML };
      downloadDOCX(exam);
    };

    // Bind download buttons in generate page
    $('#downloadPdf')?.addEventListener('click', window.downloadPDFCurrent);
    $('#downloadDocx')?.addEventListener('click', window.downloadDOCXCurrent);

    // Profile modal logic
    const profileModal = $('#profileModal');
    const openProfile = $('#openProfile');
    const closeProfileModal = $('#closeProfileModal');
    const cancelProfile = $('#cancelProfile');
    const saveProfile = $('#saveProfile');
    const userNameEls = document.querySelectorAll('.user-name');
    openProfile?.addEventListener('click', () => {
      profileModal.style.display = 'flex';
    });
    function hideModal() {
      profileModal.style.display = 'none';
    }
    closeProfileModal?.addEventListener('click', hideModal);
    cancelProfile?.addEventListener('click', hideModal);
    saveProfile?.addEventListener('click', () => {
      const newName = $('#profileName').value || 'User';
      userNameEls.forEach((el) => (el.textContent = newName));
      $('#userGreeting').textContent = newName;
      hideModal();
    });

    // Logout simply redirects to auth page
    $('#logoutBtn')?.addEventListener('click', () => {
      window.location.href = 'auth.html#login';
    });

    // Helper: update dashboard metrics at first load
    updateDashboardSummary();
    updateRecentExams();
    updateMyExams();
  }

  /**
   * Build the exam prompt based on user selections.
   * Reads values from form inputs to construct a structured request
   * understood by the AI backend.
   * @param {string} content - summarized learning material
   * @returns {string}
   */
  function buildPrompt(content) {
    const subject = $('#subject').value;
    const topic = $('#titleMaterial').value;
    const grade = $('#grade').value;
    const questionCount = $('#questionCount').value || '20';
    // Determine selected exam formats from checkboxes
    const checkedFormats = Array.from(document.querySelectorAll('.format:checked')).map((cb) => cb.value);
    const formats = checkedFormats.join(', ');
    const difficulty = (() => {
      const easy = parseInt($('#easy').value || '0');
      const medium = parseInt($('#medium').value || '0');
      const hard = parseInt($('#hard').value || '0');
      const max = Math.max(easy, medium, hard);
      if (max === easy) return 'Easy';
      if (max === medium) return 'Medium';
      if (max === hard) return 'Hard';
      return 'Any';
    })();
    const shuffle = $('#shuffle').checked ? 'Yes' : 'No';
    const answerKey = $('#answerKey').checked ? 'Yes' : 'No';

    return `You are an Exam Generator AI. Based on the details below, generate a complete exam only without any exam title or header. Strictly avoid and do not use markdown formatting like **bold**, ## headings, or --- lines. Output plain text, neatly formatted like a printable exam paper. Avoid any instructions or extra messages. Follow this layout:\n\n- For each section, add a clear heading (e.g., Multiple Choice).\n- For Multiple Choice: List questions with choices labeled A–D.\n- For True or False: Use underscores before the number and question.\n- For Identification & Essay: Leave underscores or blank space.\n- Do not add extra characters or markdown syntax.\n- Do not add an exam title.\n- If any value/content below is missing, avoid including it in the exam.\n\nSubject: ${subject}\nTopic: ${topic}\nGrade Level: ${grade}\nExam Formats: ${formats}\nNumber of Questions: ${questionCount}\nDifficulty: ${difficulty}\nShuffle Questions: ${shuffle}\nInclude Answer Key: ${answerKey}\n\nLearning Material:\n"""\n${content}\n"""`;
  }

  /**
   * Summarize extracted learning material using AI summarization API
   * @param {string} text
   * @returns {Promise<string|null>}
   */
  async function summarizeContent(text) {
    const model = document.getElementById('model')?.value || 'deepseek/deepseek-r1:free';
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apikey,
          'HTTP-Referer': 'https://ivnx9.github.io',
          'X-Title': 'Exam Miner 2.0'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'Summarize this learning material to include only the most important topics, keywords, concepts, and definitions. Ignore greetings or instructions.' },
            { role: 'user', content: text }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /**
   * Send prompt to AI to generate exam
   * @param {string} prompt
   * @returns {Promise<string|null>}
   */
  async function sendToAI(prompt) {
    const model = document.getElementById('model')?.value || 'deepseek/deepseek-r1:free';
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apikey,
          'HTTP-Referer': 'https://ivnx9.github.io',
          'X-Title': 'Exam Miner 2.0'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are an expert AI Exam Generator with the applied TOS.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // Use the provided API key from original code. In production this
  // should be kept secret and never exposed in client scripts.
  const apikey = 'Bearer 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';

  // Initialize dashboard only when the required DOM nodes exist
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboardPage')) {
      initDashboard();
    }
  });
})();
