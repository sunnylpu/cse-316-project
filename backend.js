document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const memorySizeInput = document.getElementById('memorySize');
    const pageSizeInput = document.getElementById('pageSize');
    const replacementAlgorithmSelect = document.getElementById('replacementAlgorithm');
    const memoryTechniqueSelect = document.getElementById('memoryTechnique');
    const processSizeInput = document.getElementById('processSize');
    const segmentSizesInput = document.getElementById('segmentSizes');
    const referenceStringInput = document.getElementById('referenceString');
    const initBtn = document.getElementById('initBtn');
    const addProcessBtn = document.getElementById('addProcessBtn');
    const generateRefBtn = document.getElementById('generateRefBtn');
    const simulateBtn = document.getElementById('simulateBtn');
    const stepBtn = document.getElementById('stepBtn');
    const memoryVisualization = document.getElementById('memoryVisualization');
    const pageTableBody = document.querySelector('#pageTable tbody');
    const simulationLog = document.getElementById('simulationLog');
    const pageFaultsDisplay = document.getElementById('pageFaults');
    const hitRatioDisplay = document.getElementById('hitRatio');
    const memoryUtilizationDisplay = document.getElementById('memoryUtilization');
    const processCountDisplay = document.getElementById('processCount');

                          // Memory State
    let memory = [];
    let frames = [];
    let pageTable = [];
    let processes = [];
    let currentProcessId = 1;
    let referenceString = [];
    let currentReferenceIndex = 0;
    let pageFaults = 0;
    let pageHits = 0;
    let replacementQueue = [];
    let lruCounters = {};

    // Initialize memory
    initBtn.addEventListener('click', initializeMemory);
    addProcessBtn.addEventListener('click', addProcess);
    generateRefBtn.addEventListener('click', generateRandomReferences);
    simulateBtn.addEventListener('click', simulateReferences);
    stepBtn.addEventListener('click', stepThroughReferences);
    memoryTechniqueSelect.addEventListener('change', toggleSegmentationInput);

    function initializeMemory() {
        const memorySize = parseInt(memorySizeInput.value);
        const pageSize = parseInt(pageSizeInput.value);
        
        if (pageSize > memorySize) {
            alert("Page size cannot be larger than total memory size");
            return;
        }
// Initialize memory blocks
        memory = [];
        frames = Array(numFrames).fill(null);
        pageTable = [];
        processes = [];
        currentProcessId = 1;
        referenceString = [];
        currentReferenceIndex = 0;
        pageFaults = 0;
        pageHits = 0;
        replacementQueue = [];
        lruCounters = {};

        // Update UI
        updateStatistics();
        renderMemory();
        updatePageTable();
        simulationLog.innerHTML = '';
        referenceStringInput.value = '';

        // Log initialization
        addLogEntry(`Memory initialized with ${memorySize}KB total, ${pageSize}KB page size, ${numFrames} frames`);
    }
