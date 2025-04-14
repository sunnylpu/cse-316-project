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
function addProcess() {
        if (frames.length === 0) {
            alert("Please initialize memory first");
            return;
        }

        const processSize = parseInt(processSizeInput.value);
        const technique = memoryTechniqueSelect.value;
        const pageSize = parseInt(pageSizeInput.value);
        const numPages = Math.ceil(processSize / pageSize);
        const processId = currentProcessId++;

        let segments = [];
        if (technique.includes('segmentation')) {
            const segmentSizes = segmentSizesInput.value.split(',').map(s => parseInt(s.trim()));
            if (segmentSizes.some(isNaN)) {
                alert("Please enter valid segment sizes (comma separated numbers)");
                return;
            }
            segments = segmentSizes.map((size, i) => ({
                id: i + 1,
                name: ['Code', 'Data', 'Stack', 'Heap'][i] || `Segment ${i + 1}`,
                size: size,
                pages: Math.ceil(size / pageSize)
            }));
        } else {
            // For pure paging, treat the whole process as one segment
            segments = [{
                id: 1,
                name: 'Process',
                size: processSize,
                pages: numPages
            }];
        }

        const process = {
            id: processId,
            size: processSize,
            segments: segments,
            pageTable: {}
        };

        // Allocate pages for each segment
        let allocated = false;
        for (const segment of segments) {
            for (let i = 0; i < segment.pages; i++) {
                const pageId = `${processId}.${segment.id}.${i}`;
                const freeFrameIndex = frames.findIndex(frame => frame === null);
                
                if (freeFrameIndex !== -1) {
                    // Allocate frame
                    frames[freeFrameIndex] = {
                        processId: processId,
                        segmentId: segment.id,
                        pageId: i,
                        loaded: true
                    };
                    
                    // Update page table
                    process.pageTable[`${segment.id}.${i}`] = {
                        frame: freeFrameIndex,
                        valid: true,
                        referenced: false,
                        modified: false
                    };

                    // Update replacement structures
                    replacementQueue.push(pageId);
                    lruCounters[pageId] = Date.now();
                    allocated = true;
                } else {
                    // No free frames available
                    process.pageTable[`${segment.id}.${i}`] = {
                        frame: -1,
                        valid: false,
                        referenced: false,
                        modified: false
                    };
                }
            }
        }

        if (allocated) {
            processes.push(process);
            addLogEntry(`Process ${processId} added with ${processSize}KB (${numPages} pages)`);
            updateStatistics();
            renderMemory();
            updatePageTable();
        } else {
            addLogEntry(`Failed to add Process ${processId} - no free frames available`, true);
        }
    }

    function generateRandomReferences() {
        if (processes.length === 0) {
            alert("Please add at least one process first");
            return;
        }

        const numReferences = 10 + Math.floor(Math.random() * 10);
        const refs = [];
        
        for (let i = 0; i < numReferences; i++) {
            const randomProcess = processes[Math.floor(Math.random() * processes.length)];
            const randomSegment = randomProcess.segments[Math.floor(Math.random() * randomProcess.segments.length)];
            const randomPage = Math.floor(Math.random() * randomSegment.pages);
            
            refs.push(`${randomProcess.id}.${randomSegment.id}.${randomPage}`);
        }

        referenceString = refs;
        referenceStringInput.value = refs.join(',');
        currentReferenceIndex = 0;
        addLogEntry(`Generated random reference string with ${numReferences} entries`);
    }

    function simulateReferences() {
        if (referenceString.length === 0) {
            const refString = referenceStringInput.value.trim();
            if (!refString) {
                alert("Please enter or generate a reference string first");
                return;
            }
            referenceString = refString.split(',').map(s => s.trim());
        }

        currentReferenceIndex = 0;
        pageFaults = 0;
        pageHits = 0;
        simulationLog.innerHTML = '';
        
        // Reset all referenced bits
        for (const process of processes) {
            for (const pageKey in process.pageTable) {
                process.pageTable[pageKey].referenced = false;
            }
        }

        // Process all references
        while (currentReferenceIndex < referenceString.length) {
            processReference(referenceString[currentReferenceIndex]);
            currentReferenceIndex++;
        }

        updateStatistics();
    }

    function stepThroughReferences() {
        if (referenceString.length === 0) {
            const refString = referenceStringInput.value.trim();
            if (!refString) {
                alert("Please enter or generate a reference string first");
                return;
            }
            referenceString = refString.split(',').map(s => s.trim());
            currentReferenceIndex = 0;
            pageFaults = 0;
            pageHits = 0;
            simulationLog.innerHTML = '';
            
            // Reset all referenced bits
            for (const process of processes) {
                for (const pageKey in process.pageTable) {
                    process.pageTable[pageKey].referenced = false;
                }
            }
        }

        if (currentReferenceIndex < referenceString.length) {
            processReference(referenceString[currentReferenceIndex]);
            currentReferenceIndex++;
            updateStatistics();
        } else {
            addLogEntry("All references processed");
        }
    }

    function processReference(ref) {
        const [processId, segmentId, pageId] = ref.split('.').map(Number);
        const process = processes.find(p => p.id === processId);
        
        if (!process) {
            addLogEntry(`Invalid reference: Process ${processId} not found`, true);
            return;
        }

        const pageKey = `${segmentId}.${pageId}`;
        const pageEntry = process.pageTable[pageKey];
        
        if (!pageEntry) {
            addLogEntry(`Invalid reference: Page ${pageId} in Segment ${segmentId} not found for Process ${processId}`, true);
            return;
        }

        // Mark as referenced
        pageEntry.referenced = true;
        
        if (pageEntry.valid) {
            // Page hit
            pageHits++;
            lruCounters[ref] = Date.now(); // Update LRU counter
            addLogEntry(`Page hit: Process ${processId}, Segment ${segmentId}, Page ${pageId} (Frame ${pageEntry.frame})`, false, 'hit');
            
            // Highlight the frame in visualization
            highlightFrame(pageEntry.frame);
        } else {
            // Page fault
            pageFaults++;
            addLogEntry(`Page fault: Process ${processId}, Segment ${segmentId}, Page ${pageId}`, false, 'fault');
            
            // Handle page replacement
            handlePageFault(processId, segmentId, pageId);
        }

        updatePageTable();
    }

    function handlePageFault(processId, segmentId, pageId) {
        const pageSize = parseInt(pageSizeInput.value);
        const algorithm = replacementAlgorithmSelect.value;
        const ref = `${processId}.${segmentId}.${pageId}`;
        const process = processes.find(p => p.id === processId);
        const pageKey = `${segmentId}.${pageId}`;
        
        // Find a free frame first
        let freeFrameIndex = frames.findIndex(frame => frame === null);
        
        if (freeFrameIndex === -1) {
            // No free frames, need to replace
            switch (algorithm) {
                case 'FIFO':
                    freeFrameIndex = fifoReplacement();
                    break;
                case 'LRU':
                    freeFrameIndex = lruReplacement();
                    break;
                case 'OPT':
                    // Optimal is theoretical, we'll just use FIFO for this demo
                    freeFrameIndex = fifoReplacement();
                    break;
            }
            
            if (freeFrameIndex === -1) {
                addLogEntry("No frames available for replacement", true);
                return;
            }
            
            // Remove the replaced page from its process page table
            const replacedFrame = frames[freeFrameIndex];
            if (replacedFrame) {
                const replacedProcess = processes.find(p => p.id === replacedFrame.processId);
                if (replacedProcess) {
                    const replacedPageKey = `${replacedFrame.segmentId}.${replacedFrame.pageId}`;
                    replacedProcess.pageTable[replacedPageKey].valid = false;
                    addLogEntry(`Replaced Process ${replacedFrame.processId}, Segment ${replacedFrame.segmentId}, Page ${replacedFrame.pageId} from Frame ${freeFrameIndex}`);
                }
            }
        }
        
        // Allocate the new page
        frames[freeFrameIndex] = {
            processId: processId,
            segmentId: segmentId,
            pageId: pageId,
            loaded: true
        };
        
        // Update page table
        process.pageTable[pageKey] = {
            frame: freeFrameIndex,
            valid: true,
            referenced: true,
            modified: false
        };
        
        // Update replacement structures
        replacementQueue.push(ref);
        lruCounters[ref] = Date.now();
        
        // Highlight the frame in visualization
        highlightFrame(freeFrameIndex);
    }

    function fifoReplacement() {
        if (replacementQueue.length === 0) return -1;
        
        const firstRef = replacementQueue[0];
        const [processId, segmentId, pageId] = firstRef.split('.').map(Number);
        const process = processes.find(p => p.id === processId);
        
        if (!process) {
            replacementQueue.shift();
            return fifoReplacement();
        }
        
        const pageKey = `${segmentId}.${pageId}`;
        const pageEntry = process.pageTable[pageKey];
        
        if (!pageEntry || !pageEntry.valid) {
            replacementQueue.shift();
            return fifoReplacement();
        }
        
        replacementQueue.shift();
        return pageEntry.frame;
    }

    function lruReplacement() {
        let lruRef = null;
        let lruTime = Infinity;
        
        for (const ref in lruCounters) {
            const [processId, segmentId, pageId] = ref.split('.').map(Number);
            const process = processes.find(p => p.id === processId);
            
            if (process) {
                const pageKey = `${segmentId}.${pageId}`;
                const pageEntry = process.pageTable[pageKey];
                
                if (pageEntry && pageEntry.valid && lruCounters[ref] < lruTime) {
                    lruTime = lruCounters[ref];
                    lruRef = ref;
                }
            }
        }
        
        if (!lruRef) return -1;
        
        const [processId, segmentId, pageId] = lruRef.split('.').map(Number);
        const process = processes.find(p => p.id === processId);
        const pageKey = `${segmentId}.${pageId}`;
        
        return process.pageTable[pageKey].frame;
    }

    function renderMemory() {
        memoryVisualization.innerHTML = '';
        const pageSize = parseInt(pageSizeInput.value);
        
        frames.forEach((frame, index) => {
            const block = document.createElement('div');
            block.className = 'memory-block';
            block.style.width = `calc(${100 / frames.length}% - 10px)`;
            block.style.minWidth = '80px';
            
            if (frame === null) {
                block.classList.add('free');
                block.textContent = `Frame ${index}\nFree`;
            } else {
                block.classList.add('allocated');
                block.textContent = `Frame ${index}\nP${frame.processId}.S${frame.segmentId}.Pg${frame.pageId}`;
                block.title = `Process ${frame.processId}, Segment ${frame.segmentId}, Page ${frame.pageId}`;
            }
            
            memoryVisualization.appendChild(block);
        });
    }

    function highlightFrame(frameIndex) {
        // Remove active class from all blocks
        document.querySelectorAll('.memory-block').forEach(block => {
            block.classList.remove('active');
        });
        
        // Add active class to the referenced frame
        if (frameIndex >= 0 && frameIndex < frames.length) {
            const blocks = document.querySelectorAll('.memory-block');
            if (blocks[frameIndex]) {
                blocks[frameIndex].classList.add('active');
                
                // Scroll into view
                setTimeout(() => {
                    blocks[frameIndex].scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }, 100);
            }
        }
    }

    function updatePageTable() {
        pageTableBody.innerHTML = '';
        
        for (const process of processes) {
            for (const segment of process.segments) {
                for (let i = 0; i < segment.pages; i++) {
                    const pageKey = `${segment.id}.${i}`;
                    const pageEntry = process.pageTable[pageKey] || {
                        frame: -1,
                        valid: false,
                        referenced: false,
                        modified: false
                    };
                    
                    const row = document.createElement('tr');
                    if (pageEntry.valid) {
                        row.classList.add('table-success');
                    } else {
                        row.classList.add('table-danger');
                    }
                    
                    row.innerHTML = `
                        <td>P${process.id}</td>
                        <td>S${segment.id}.Pg${i}</td>
                        <td>${pageEntry.valid ? pageEntry.frame : 'Disk'}</td>
                        <td>${pageEntry.valid ? '✓' : '✗'}</td>
                        <td>${pageEntry.referenced ? '✓' : '✗'}</td>
                        <td>${pageEntry.modified ? '✓' : '✗'}</td>
                    `;
                    
                    pageTableBody.appendChild(row);
                }
            }
        }
    }

    function updateStatistics() {
        pageFaultsDisplay.textContent = pageFaults;
        
        const totalReferences = pageFaults + pageHits;
        const hitRatio = totalReferences > 0 ? Math.round((pageHits / totalReferences) * 100) : 0;
        hitRatioDisplay.textContent = `${hitRatio}%`;
        
        const usedFrames = frames.filter(f => f !== null).length;
        const utilization = frames.length > 0 ? Math.round((usedFrames / frames.length) * 100) : 0;
        memoryUtilizationDisplay.textContent = `${utilization}%`;
        
        processCountDisplay.textContent = processes.length;
    }

    function addLogEntry(message, isError = false, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type === 'fault' ? 'page-fault' : ''} ${type === 'hit' ? 'page-hit' : ''}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        simulationLog.appendChild(entry);
        simulationLog.scrollTop = simulationLog.scrollHeight;
    }

    function toggleSegmentationInput() {
        const technique = memoryTechniqueSelect.value;
        const segmentationConfig = document.querySelector('.segmentation-config');
        
        if (technique.includes('segmentation')) {
            segmentationConfig.style.display = 'block';
        } else {
            segmentationConfig.style.display = 'none';
        }
    }

    // Initialize
    toggleSegmentationInput();
});
