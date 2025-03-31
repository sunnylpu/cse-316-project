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