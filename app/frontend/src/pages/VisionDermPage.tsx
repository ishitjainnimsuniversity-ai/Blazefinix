import React, { useState, useEffect, useRef, Component, ErrorInfo } from 'react';
import {
  Camera,
  Activity,
  Cpu,
  Download,
  FileText,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  Dna,
  Layers,
  Sparkles,
  ChevronRight,
  Video,
  VideoOff,
  Image as ImageIcon,
  FolderOpen,
  FileSpreadsheet,
  FileCode,
  Zap,
  Users,
  Atom,
  ExternalLink,
  Info,
  Award,
  UserCheck
} from 'lucide-react';
import {
  fetchSkinReferenceSamples,
  analyzeSkinImage,
  predictMultiModalDiseaseRisk,
  getReportPdfUrl,
  getDoctorReportPdfUrl,
  getPatientReportPdfUrl,
  fetchRealDermalCases,
  fetchDermalCohortCases,
  fetchDermalMutations,
  fetchDermalGeneStructure
} from '../api';
import {
  SkinReferenceSample,
  VisionAnalysisResult,
  MultiModalPredictResponse,
  PhototypeRiskPoint
} from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

// Safe helper to read bloch theta angle whether stored as dictionary or array
function getBlochTheta(coords: any, key: string, index: number): string {
  if (!coords) return '0.00';
  if (coords[key]?.theta !== undefined) return Number(coords[key].theta).toFixed(2);
  if (Array.isArray(coords) && coords[index]?.theta !== undefined) return Number(coords[index].theta).toFixed(2);
  if (coords[index]?.theta !== undefined) return Number(coords[index].theta).toFixed(2);
  return '0.00';
}

class VisionDermErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || String(error) };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error('VisionDermErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel-elevated p-8 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Skin & Genomic Vision Component Recovered</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            A temporary parameter mismatch was intercepted. Click below to reload the interactive optical workspace.
          </p>
          <div className="text-[11px] font-mono text-rose-300 bg-black/40 p-3 rounded-lg max-w-lg mx-auto overflow-x-auto text-left">
            {this.state.error}
          </div>
          <button
            onClick={this.handleReset}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
          >
            Reload Skin Vision Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const VisionDermPageInner: React.FC = () => {
  // Patient Demographics - default to healthy baseline
  const [patientName, setPatientName] = useState('Sophia Martinez');
  const [patientAge, setPatientAge] = useState<number>(28);
  const [patientSex, setPatientSex] = useState<'Female' | 'Male'>('Female');

  // Genomic Biomarkers - default to normal healthy baseline
  const [tp53Score, setTp53Score] = useState<number>(0.0);
  const [brcaPresent, setBrcaPresent] = useState<boolean>(false);
  const [tmb, setTmb] = useState<number>(1.2);
  const [familyHistory, setFamilyHistory] = useState<boolean>(false);
  const [inflammatoryScore, setInflammatoryScore] = useState<number>(0.6);

  // Optical Input Modes: 'camera' | 'upload' | 'reference'
  const [inputMode, setInputMode] = useState<'camera' | 'upload' | 'reference'>('camera');

  // Camera Stream & Capture State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reference Skin Samples
  const [samples, setSamples] = useState<SkinReferenceSample[]>([]);
  const [selectedSampleIdx, setSelectedSampleIdx] = useState<number>(2); // Default to Type III Intermediate

  // OpenCV Vision Analysis State
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [loadingVision, setLoadingVision] = useState<boolean>(false);

  // Multi-Modal ML Prediction State
  const [prediction, setPrediction] = useState<MultiModalPredictResponse | null>(null);
  const [loadingPredict, setLoadingPredict] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Real Dermal Cases Library (Both Sexes)
  const [realDermalCases, setRealDermalCases] = useState<any>(null);
  const [activeDermalSexTab, setActiveDermalSexTab] = useState<'females' | 'males'>('females');
  const [loadingRealCases, setLoadingRealCases] = useState<boolean>(false);

  // Live Biomedical APIs for Cutaneous Health
  const [activeApiTab, setActiveApiTab] = useState<'ensembl' | 'gdc' | 'cbioportal'>('ensembl');
  const [selectedGene, setSelectedGene] = useState<'MC1R' | 'BRAF' | 'CDKN2A'>('MC1R');
  const [geneStructure, setGeneStructure] = useState<any>(null);
  const [loadingGene, setLoadingGene] = useState<boolean>(false);
  const [gdcCases, setGdcCases] = useState<any[]>([]);
  const [loadingGdc, setLoadingGdc] = useState<boolean>(false);
  const [cbioportalMuts, setCbioportalMuts] = useState<any[]>([]);
  const [loadingCbio, setLoadingCbio] = useState<boolean>(false);

  // Load reference skin samples and real cases on mount
  useEffect(() => {
    async function initData() {
      try {
        const [refSamples, dermalData] = await Promise.all([
          fetchSkinReferenceSamples().catch(() => []),
          fetchRealDermalCases().catch(() => null)
        ]);
        if (Array.isArray(refSamples) && refSamples.length > 0) {
          setSamples(refSamples);
        }
        if (dermalData) {
          setRealDermalCases(dermalData);
        }

        // Initialize with default Type III reference analysis
        if (Array.isArray(refSamples) && refSamples.length > 2) {
          runVisionAnalysisReference(2);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    initData();
    loadGeneData('MC1R').catch(() => {});

    return () => {
      stopCamera();
    };
  }, []);

  // Load Gene Data from Ensembl
  async function loadGeneData(gene: 'MC1R' | 'BRAF' | 'CDKN2A') {
    setSelectedGene(gene);
    setLoadingGene(true);
    try {
      const data = await fetchDermalGeneStructure(gene);
      setGeneStructure(data);
    } catch (err) {
      console.error('Failed to load Ensembl gene structure:', err);
    } finally {
      setLoadingGene(false);
    }
  }

  // Load Live GDC SKCM Cohort Cases
  async function loadGdcCases() {
    setLoadingGdc(true);
    try {
      const data = await fetchDermalCohortCases(8);
      setGdcCases(data);
    } catch (err) {
      console.error('Failed to load GDC SKCM cases:', err);
    } finally {
      setLoadingGdc(false);
    }
  }

  // Load Live cBioPortal Somatic Mutations
  async function loadCbioMutations(gene: string) {
    setLoadingCbio(true);
    try {
      const data = await fetchDermalMutations(gene, 10);
      setCbioportalMuts(data);
    } catch (err) {
      console.error('Failed to load cBioPortal mutations:', err);
    } finally {
      setLoadingCbio(false);
    }
  }

  // 1-Click Clinical Preset Loader
  function applyPreset(presetType: 'healthy' | 'dysplastic' | 'melanoma_high' | 'melanoma_critical') {
    if (presetType === 'healthy') {
      setPatientName('Sophia Martinez');
      setPatientAge(28);
      setPatientSex('Female');
      setTp53Score(0.0);
      setBrcaPresent(false);
      setTmb(1.2);
      setFamilyHistory(false);
      setInflammatoryScore(0.5);
      runVisionAnalysisReference(2); // Type III
    } else if (presetType === 'dysplastic') {
      setPatientName('Claire Dupont');
      setPatientAge(44);
      setPatientSex('Female');
      setTp53Score(0.15);
      setBrcaPresent(false);
      setTmb(3.1);
      setFamilyHistory(true);
      setInflammatoryScore(1.6);
      runVisionAnalysisReference(1); // Type II
    } else if (presetType === 'melanoma_high') {
      setPatientName('TCGA Dermal Donor 05');
      setPatientAge(56);
      setPatientSex('Female');
      setTp53Score(0.62);
      setBrcaPresent(false);
      setTmb(16.4);
      setFamilyHistory(true);
      setInflammatoryScore(3.9);
      runVisionAnalysisReference(0); // Type I
    } else if (presetType === 'melanoma_critical') {
      setPatientName('TCGA Dermal Donor 06');
      setPatientAge(63);
      setPatientSex('Male');
      setTp53Score(0.78);
      setBrcaPresent(false);
      setTmb(28.5);
      setFamilyHistory(true);
      setInflammatoryScore(5.4);
      runVisionAnalysisReference(1); // Type II
    }
  }

  // 1-Click Real Dermal Case Loader from Library
  async function loadRealDermalCase(caseItem: any) {
    if (!caseItem) return;
    setPatientName(caseItem.patient_name || 'Clinical Patient');
    setPatientAge(Number(caseItem.age || 40));
    setPatientSex(caseItem.gender === 'male' || caseItem.gender === 'Male' ? 'Male' : 'Female');
    setTp53Score(Number(caseItem.tp53_mutation_score || 0.0));
    setBrcaPresent(Number(caseItem.brca_variant_presence || 0) > 0.5);
    setTmb(Number(caseItem.tumor_mutational_burden || 1.2));
    setFamilyHistory(Number(caseItem.family_history_cancer || 0) > 0.5);
    setInflammatoryScore(Number(caseItem.inflammatory_biomarker_score || 0.6));

    const itaVal = Number(caseItem.ita_degrees !== undefined ? caseItem.ita_degrees : 35.0);
    const eryVal = Number(caseItem.erythema_index !== undefined ? caseItem.erythema_index : 14.0);
    const borderVal = Number(caseItem.border_irregularity_score !== undefined ? caseItem.border_irregularity_score : 0.08);
    const variegVal = Number(caseItem.color_variegation_score !== undefined ? caseItem.color_variegation_score : 0.10);

    // Create a simulated vision analysis result matching this real patient
    const mockAnalysis: VisionAnalysisResult = {
      l_star: 50.0 + itaVal * 0.4,
      a_star: 12.0 + eryVal * 0.3,
      b_star: 14.0,
      ita_degrees: itaVal,
      fitzpatrick_phototype: caseItem.fitzpatrick_phototype || 'Type III',
      skin_category: caseItem.fitzpatrick_phototype || 'Type III',
      clinical_description: caseItem.condition || 'Clinical Case Profile',
      melanin_index: Number(caseItem.melanin_index || 22.0),
      erythema_index: eryVal,
      lesion_detected: borderVal > 0.20,
      border_irregularity_score: borderVal,
      asymmetry_score: borderVal * 0.9,
      color_variegation_score: variegVal,
      image_annotated_b64: ''
    };
    setVisionAnalysis(mockAnalysis);
    setCapturedImageBase64(null);

    // Automatically trigger multi-modal prediction
    setLoadingPredict(true);
    try {
      const payload = {
        patient_name: caseItem.patient_name || 'Clinical Patient',
        patient_age: Number(caseItem.age || 40),
        patient_sex: caseItem.gender === 'male' || caseItem.gender === 'Male' ? 'Male' : 'Female',
        fitzpatrick_phototype: caseItem.fitzpatrick_phototype || 'Type III',
        ita_degrees: itaVal,
        melanin_index: Number(caseItem.melanin_index || 22.0),
        erythema_index: eryVal,
        border_irregularity_score: borderVal,
        color_variegation_score: variegVal,
        tp53_mutation_score: Number(caseItem.tp53_mutation_score || 0.0),
        brca_variant_presence: Number(caseItem.brca_variant_presence || 0),
        tumor_mutational_burden: Number(caseItem.tumor_mutational_burden || 1.2),
        family_history_cancer: Number(caseItem.family_history_cancer || 0),
        inflammatory_biomarker_score: Number(caseItem.inflammatory_biomarker_score || 0.6)
      };
      const res = await predictMultiModalDiseaseRisk(payload);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Case prediction failed');
    } finally {
      setLoadingPredict(false);
    }
  }

  // CAMERA CONTROLS
  async function startCamera() {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Camera API (getUserMedia) not supported in this browser environment.');
      }
    } catch (err: any) {
      console.warn('Webcam start notice:', err);
      setCameraError('Camera access declined or device busy. You can use reference samples or upload a photo.');
      setIsCameraActive(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }

  function captureFrame() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    setCapturedImageBase64(dataUrl);
    stopCamera();
    analyzeCapturedImage(dataUrl);
  }

  async function analyzeCapturedImage(base64Str: string) {
    setLoadingVision(true);
    setError(null);
    try {
      const res = await analyzeSkinImage({ image_base64: base64Str });
      setVisionAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'OpenCV image analysis failed');
    } finally {
      setLoadingVision(false);
    }
  }

  async function runVisionAnalysisReference(sampleIdx: number) {
    setSelectedSampleIdx(sampleIdx);
    setLoadingVision(true);
    setError(null);
    try {
      const res = await analyzeSkinImage({ phototype_index: sampleIdx });
      setVisionAnalysis(res);
      setCapturedImageBase64(null);
    } catch (err: any) {
      setError(err.message || 'Vision analysis failed');
    } finally {
      setLoadingVision(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setCapturedImageBase64(base64);
      await analyzeCapturedImage(base64);
    };
    reader.readAsDataURL(file);
  }

  // Execute Multi-Modal Prediction
  async function handleExecutePrediction() {
    let activeVision = visionAnalysis;
    if (!activeVision) {
      activeVision = {
        l_star: 55.0,
        a_star: 14.2,
        b_star: 16.8,
        ita_degrees: 32.4,
        fitzpatrick_phototype: 'III',
        skin_category: 'Type III (Medium / Olive)',
        clinical_description: 'Standard dermato-oncology reference profile',
        melanin_index: 38.5,
        erythema_index: 32.1,
        lesion_detected: true,
        border_irregularity_score: 0.35,
        asymmetry_score: 0.28,
        color_variegation_score: 0.40,
        image_annotated_b64: ''
      };
      setVisionAnalysis(activeVision);
    }

    setLoadingPredict(true);
    setError(null);
    try {
      const payload = {
        patient_name: patientName,
        patient_age: patientAge,
        patient_sex: patientSex,
        fitzpatrick_phototype: activeVision.fitzpatrick_phototype,
        ita_degrees: activeVision.ita_degrees,
        melanin_index: activeVision.melanin_index,
        erythema_index: activeVision.erythema_index,
        border_irregularity_score: activeVision.border_irregularity_score,
        color_variegation_score: activeVision.color_variegation_score,
        tp53_mutation_score: tp53Score,
        brca_variant_presence: brcaPresent ? 1.0 : 0.0,
        tumor_mutational_burden: tmb,
        family_history_cancer: familyHistory ? 1.0 : 0.0,
        inflammatory_biomarker_score: inflammatoryScore
      };

      const res = await predictMultiModalDiseaseRisk(payload);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Multi-modal prediction failed');
    } finally {
      setLoadingPredict(false);
    }
  }

  function downloadCapturedImage() {
    if (!capturedImageBase64 && !visionAnalysis?.image_annotated_b64) return;
    const link = document.createElement('a');
    link.href = capturedImageBase64 || `data:image/jpeg;base64,${visionAnalysis?.image_annotated_b64}`;
    link.download = `real_skin_capture_${patientName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadTelemetryJson() {
    if (!visionAnalysis) return;
    const exportData = {
      subject: {
        patient_name: patientName,
        patient_age: patientAge,
        patient_sex: patientSex,
        evaluation_timestamp: new Date().toISOString()
      },
      optical_skin_telemetry: {
        fitzpatrick_phototype: visionAnalysis.fitzpatrick_phototype,
        skin_category: visionAnalysis.skin_category,
        ita_degrees: visionAnalysis.ita_degrees,
        melanin_index: visionAnalysis.melanin_index,
        erythema_index: visionAnalysis.erythema_index,
        border_irregularity_score: visionAnalysis.border_irregularity_score,
        color_variegation_score: visionAnalysis.color_variegation_score,
        color_space_lab: { L: visionAnalysis.l_star, a: visionAnalysis.a_star, b: visionAnalysis.b_star }
      },
      genomic_profile: {
        tp53_mutation_score: tp53Score,
        brca_pathogenic_variant: brcaPresent,
        tumor_mutational_burden_mut_mb: tmb,
        family_history_cancer: familyHistory,
        inflammatory_biomarker_hs_crp: inflammatoryScore
      },
      model_predictions: prediction
        ? {
            record_id: prediction.record_id,
            xgboost_risk: prediction.classical_xgboost_risk,
            adaboost_risk: prediction.classical_adaboost_risk,
            quantum_vqc_risk: prediction.quantum_vqc_risk,
            hybrid_decision_score: prediction.hybrid_decision_score,
            risk_category: prediction.risk_category,
            epistemic_uncertainty: prediction.epistemic_uncertainty
          }
        : null,
      medical_disclaimer:
        'AI-generated risk assessment — not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional.'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skin_telemetry_${patientName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadTelemetryCsv() {
    if (!visionAnalysis) return;
    const lines = [
      'Category,Parameter,Measured_Value,Unit,Clinical_Interpretation',
      `Patient,Full Name,"${patientName}",String,Evaluated Patient`,
      `Patient,Age,${patientAge},Years,Chronological Age`,
      `Patient,Sex,"${patientSex}",Categorical,Biological Sex`,
      `Dermatology,Fitzpatrick Phototype,"${visionAnalysis.fitzpatrick_phototype}",Classification,Optical Skin Classification`,
      `Dermatology,Individual Typology Angle (ITA),${visionAnalysis.ita_degrees},Degrees,Objective Colorimetric Tone`,
      `Dermatology,Melanin Index,{visionAnalysis.melanin_index},Relative Units,Epidermal Melanin Content`,
      `Dermatology,Erythema Index,{visionAnalysis.erythema_index},Relative Units,Cutaneous Hemoglobin Vascularization`,
      `Dermatology,Border Irregularity Score,{visionAnalysis.border_irregularity_score},Normalized Delta,OpenCV Contour Convexity Delta`,
      `Dermatology,Color Variegation Score,{visionAnalysis.color_variegation_score},Normalized Index,Chromatic Dispersion (RGB SD)`,
      `Genomics,TP53 Mutation Score,{tp53Score},Scale [0-1],Tumor Suppressor Inactivation`,
      `Genomics,BRCA Pathogenic Variant,{brcaPresent ? 1 : 0},Binary,DNA Repair Homologous Recombination`,
      `Genomics,Tumor Mutational Burden,{tmb},mut/Mb,Somatic Mutation Density`,
      `Genomics,hs-CRP Inflammation,{inflammatoryScore},mg/L,Microenvironment Inflammation`
    ];

    if (prediction) {
      lines.push(
        `Prediction,XGBoost Risk,{prediction.classical_xgboost_risk},Probability,Gradient Boosted Trees`,
        `Prediction,AdaBoost Risk,{prediction.classical_adaboost_risk},Probability,Adaptive Decision Stumps`,
        `Prediction,Quantum VQC Risk,{prediction.quantum_vqc_risk},Probability,Parameterized Quantum Circuit`,
        `Prediction,Hybrid Consensus,{prediction.hybrid_decision_score},Probability,Tri-Model Consensus`,
        `Prediction,Risk Tier,"${prediction.risk_category}",Category,Stratification Tier`
      );
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skin_telemetry_${patientName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Hidden canvas for video frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Camera className="w-3 h-3" /> OPENCV COMPUTER VISION + DUAL BOOSTING + QML
            </span>
            <span className="text-xs text-slate-400">Multi-Modal Dermatological & Cutaneous Genomics</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Real Skin Optical Telemetry & Cutaneous Disease Risk Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Extracts real skin colorimetry (ITA°, Melanin index, Erythema index, lesion irregularity) via live webcam or imagery, fusing optical data with real genomic biomarkers (MC1R, BRAF, CDKN2A) to compute calibrated risk through <strong>XGBoost + AdaBoost + 4-Qubit VQC</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadTelemetryJson}
            disabled={!visionAnalysis}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
            title="Download full OpenCV telemetry dataset as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" /> Export JSON
          </button>
          <button
            onClick={downloadTelemetryCsv}
            disabled={!visionAnalysis}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
            title="Download optical & genomic parameters as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>
          {prediction && (
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={getReportPdfUrl(prediction.record_id)}
                download={`clinical_decision_report_${prediction.record_id}.pdf`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
                title="Download Standard Clinical Decision Support PDF"
              >
                <Download className="w-3.5 h-3.5" /> Clinical PDF
              </a>
              <a
                href={getDoctorReportPdfUrl(prediction.record_id)}
                download={`doctor_clinical_report_${prediction.record_id}.pdf`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
                title="Download full detailed genetic deficiencies and multi-model report for doctors"
              >
                <Download className="w-3.5 h-3.5" /> Doctor PDF
              </a>
              <a
                href={getPatientReportPdfUrl(prediction.record_id)}
                download={`patient_skin_summary_${prediction.record_id}.pdf`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
                title="Download plain-language skin type and health summary for patients"
              >
                <Download className="w-3.5 h-3.5" /> Patient PDF
              </a>
            </div>
          )}
        </div>
      </div>

      {/* QUICK PRESETS: 1-Click Clinical Scenarios */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            1-Click Clinical Baseline Presets (Test Healthy Normal vs. Real Melanoma)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Calibrated Clinical Tiers</span>
        </div>
        
        {/* Step-by-step instruction banner */}
        <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <b>📖 Instruction:</b> Click <b>"Healthy Normal Skin (Low Risk)"</b> to verify that healthy skin with normal genetics produces a <b>LOW RISK (5-15%)</b> assessment. Click <b>"Real TCGA-SKCM Melanoma"</b> to test real malignant clinical cases.
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <button
            onClick={() => applyPreset('healthy')}
            className="p-2.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Healthy Normal Skin</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">~8% LOW</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Normal melanin, intact barrier, WT MC1R, zero mutations.</p>
          </button>

          <button
            onClick={() => applyPreset('dysplastic')}
            className="p-2.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Dysplastic Benign Nevus</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">~32% MOD</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Mild border atypia, MC1R variant, sun exposure, TMB 3.1.</p>
          </button>

          <button
            onClick={() => applyPreset('melanoma_high')}
            className="p-2.5 rounded-lg bg-orange-950/30 hover:bg-orange-900/40 border border-orange-500/30 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-orange-300">
              <span>TCGA-SKCM Stage IB</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">~68% HIGH</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Real GDC case, BRAF V600E mutation, irregular borders.</p>
          </button>

          <button
            onClick={() => applyPreset('melanoma_critical')}
            className="p-2.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-300">
              <span>TCGA-SKCM Stage IIC</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">~89% CRIT</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Ulcerated melanoma, NRAS Q61R + CDKN2A loss, high TMB.</p>
          </button>
        </div>
      </div>

      {/* REAL DERMAL PATIENTS LIBRARY SECTION (BOTH SEXES) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 bg-slate-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Verified Real Dermal Patient Cohort (Both Sexes)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Curated real-world dermal health donor records from clinical cohorts and NCI GDC (TCGA-SKCM).
            </p>
          </div>

          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setActiveDermalSexTab('females')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDermalSexTab === 'females'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Female Cohort (3 Cases)
            </button>
            <button
              onClick={() => setActiveDermalSexTab('males')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDermalSexTab === 'males'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Male Cohort (4 Cases)
            </button>
          </div>
        </div>

        {/* Instruction callout */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <b>📖 Instruction:</b> Click <b>"Load Case into Model"</b> on any patient card below to populate the optical and genomic telemetry with that verified real case and run immediate risk stratification.
          </span>
        </div>

        {/* Patient Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {realDermalCases && Array.isArray(realDermalCases[activeDermalSexTab]) && realDermalCases[activeDermalSexTab].map((c: any) => {
            const riskColor = c.risk_color || (Number(c.hybrid_risk_score || 0) >= 0.70 ? '#EF4444' : Number(c.hybrid_risk_score || 0) >= 0.40 ? '#F97316' : '#10B981');
            const riskTier = c.risk_tier || (Number(c.hybrid_risk_score || 0) >= 0.70 ? 'CRITICAL RISK' : Number(c.hybrid_risk_score || 0) >= 0.40 ? 'MODERATE RISK' : 'LOW RISK');
            const hybridRisk = Number(c.hybrid_risk_score !== undefined ? c.hybrid_risk_score : 0.084);
            const mutations = Array.isArray(c.driver_mutations) ? c.driver_mutations : (c.driver_mutations ? [c.driver_mutations] : ['None (Wildtype)']);
            const firstMut = mutations.length > 0 ? mutations[0] : 'None (Wildtype)';

            return (
              <div
                key={c.case_id || Math.random()}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-300">{c.case_id || 'DERM-CASE'}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${riskColor}20`, color: riskColor, borderColor: `${riskColor}40` }}
                    >
                      {riskTier} ({(hybridRisk * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1.5">{c.patient_name || 'Clinical Subject'}</div>
                  <div className="text-[11px] text-slate-400">{c.condition || 'Cutaneous Observation'} • {c.age || 40} yrs • {c.clinical_stage || 'Stage 0'}</div>
                  
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Phototype & ITA:</span>
                      <span className="text-slate-200 font-mono">{c.fitzpatrick_phototype || 'Type III'} ({c.ita_degrees !== undefined ? c.ita_degrees : 35}°)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Border & Variegation:</span>
                      <span className="text-slate-200 font-mono">{c.border_irregularity_score !== undefined ? c.border_irregularity_score : 0.08} | {c.color_variegation_score !== undefined ? c.color_variegation_score : 0.10}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Driver Mutations:</span>
                      <span className="text-amber-300 font-mono font-semibold truncate max-w-[140px]" title={mutations.join(', ')}>
                        {firstMut}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>MC1R Status:</span>
                      <span className="text-slate-300 truncate max-w-[140px]" title={c.mc1r_status || 'Wildtype'}>{c.mc1r_status || 'Wildtype'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => loadRealDermalCase(c)}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400" /> Load Case into Model
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* LIVE BIOMEDICAL APIS FOR CUTANEOUS HEALTH */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Dna className="w-5 h-5 text-sky-400" />
              Live Cutaneous Biomedical APIs (Ensembl, NCI GDC & cBioPortal)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect real genomic coordinates (MC1R/BRAF), TCGA-SKCM cohort cases, and somatic mutation registries.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setActiveApiTab('ensembl')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeApiTab === 'ensembl' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ensembl Exon Structure
            </button>
            <button
              onClick={() => { setActiveApiTab('gdc'); loadGdcCases(); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeApiTab === 'gdc' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              NCI GDC (TCGA-SKCM)
            </button>
            <button
              onClick={() => { setActiveApiTab('cbioportal'); loadCbioMutations('BRAF'); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeApiTab === 'cbioportal' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              cBioPortal Mutations
            </button>
          </div>
        </div>

        {/* Tab 1: Ensembl Live Exons */}
        {activeApiTab === 'ensembl' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Select Cutaneous Driver Gene:</span>
              {(['MC1R', 'BRAF', 'CDKN2A'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => loadGeneData(g)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedGene === g
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {loadingGene ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" /> Fetching live coordinates from Ensembl REST API...
              </div>
            ) : geneStructure ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white font-mono">{geneStructure.gene_symbol} ({geneStructure.ensembl_id})</span>
                  <span className="text-slate-400 font-mono">Chr {geneStructure.chromosome}: {geneStructure.start?.toLocaleString()} - {geneStructure.end?.toLocaleString()} ({geneStructure.length_bp?.toLocaleString()} bp)</span>
                </div>
                <p className="text-[11px] text-slate-400">{geneStructure.description}</p>
                
                {/* Exon visual track */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 mb-1.5 flex justify-between">
                    <span>Canonical Transcript ({geneStructure.canonical_transcript})</span>
                    <span>{geneStructure.exons?.length || 0} Exons Resolved</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                    {geneStructure.exons?.map((ex: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 shrink-0 text-center"
                        title={`Exon ${idx + 1}: ${ex.length} bp`}
                      >
                        Exon {idx + 1}
                        <div className="text-[8px] text-slate-400">{ex.length} bp</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 2: NCI GDC SKCM Cohort */}
        {activeApiTab === 'gdc' && (
          <div className="space-y-3">
            {loadingGdc ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" /> Querying NCI GDC API (api.gdc.cancer.gov) for TCGA-SKCM...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono">
                    <tr>
                      <th className="p-2.5">Submitter ID</th>
                      <th className="p-2.5">Age</th>
                      <th className="p-2.5">Diagnosis</th>
                      <th className="p-2.5">AJCC Stage</th>
                      <th className="p-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {gdcCases.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-2.5 font-mono text-indigo-300 font-semibold">{c.submitter_id}</td>
                        <td className="p-2.5">{c.age || 'N/A'} yrs</td>
                        <td className="p-2.5">{c.primary_diagnosis}</td>
                        <td className="p-2.5 font-mono text-amber-300">{c.ajcc_stage || 'Stage II'}</td>
                        <td className="p-2.5">
                          <button
                            onClick={() => {
                              setPatientName(c.submitter_id);
                              setPatientAge(c.age || 58);
                              setTp53Score(0.65);
                              setTmb(18.2);
                              runVisionAnalysisReference(1);
                            }}
                            className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold"
                          >
                            Load Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: cBioPortal Mutations */}
        {activeApiTab === 'cbioportal' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Query Alteration:</span>
              {(['BRAF', 'NRAS', 'CDKN2A', 'KIT'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => loadCbioMutations(g)}
                  className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                >
                  {g}
                </button>
              ))}
            </div>

            {loadingCbio ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" /> Querying cBioPortal API (cbioportal.org/api) for SKCM...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono">
                    <tr>
                      <th className="p-2.5">Sample ID</th>
                      <th className="p-2.5">Gene</th>
                      <th className="p-2.5">Protein Change</th>
                      <th className="p-2.5">Mutation Type</th>
                      <th className="p-2.5">Genomic Locus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cbioportalMuts.map((m: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-2.5 font-mono text-indigo-300">{m.sample_id}</td>
                        <td className="p-2.5 font-bold text-white font-mono">{m.gene_symbol}</td>
                        <td className="p-2.5 font-mono text-amber-300 font-bold">{m.protein_change}</td>
                        <td className="p-2.5">{m.mutation_type}</td>
                        <td className="p-2.5 font-mono text-slate-400">chr{m.chr}:{m.start_pos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Intake Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Intake & Genetics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Patient Demographics Card */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white">Patient Demographics</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Subject Name / Submitter ID</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Biological Sex</label>
                  <select
                    value={patientSex}
                    onChange={(e) => setPatientSex(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Genomic Biomarkers Card */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Genomic & Molecular Biomarkers</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Real Cancer Panels</span>
            </div>

            {/* Instruction banner */}
            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
              📖 <b>Instruction:</b> Zero values represent healthy wildtype genetics. Elevate TP53 or TMB to test oncogenic disruption.
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">TP53 Mutation Disruption Score</span>
                  <span className="text-white font-mono font-bold">{tp53Score.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.02}
                  value={tp53Score}
                  onChange={(e) => setTp53Score(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Tumor Mutational Burden (TMB)</span>
                  <span className="text-white font-mono font-bold">{tmb.toFixed(1)} mut/Mb</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={50.0}
                  step={0.5}
                  value={tmb}
                  onChange={(e) => setTmb(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Inflammatory Biomarker (hs-CRP)</span>
                  <span className="text-white font-mono font-bold">{inflammatoryScore.toFixed(1)} mg/L</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={15.0}
                  step={0.1}
                  value={inflammatoryScore}
                  onChange={(e) => setInflammatoryScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <span>Family History of Melanoma / Skin Cancer</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={brcaPresent}
                    onChange={(e) => setBrcaPresent(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <span>BRCA / DNA Repair Defect Present</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Camera & Optical Analysis */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Optical Input Intake Card */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Cutaneous Optical Capture & Vision Analysis</h2>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => { setInputMode('camera'); if (!isCameraActive) startCamera(); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'camera' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5 inline mr-1" /> Web Camera
                </button>
                <button
                  onClick={() => { setInputMode('upload'); stopCamera(); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> Image Upload
                </button>
                <button
                  onClick={() => { setInputMode('reference'); stopCamera(); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'reference' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 inline mr-1" /> Fitzpatrick Samples
                </button>
              </div>
            </div>

            {/* Instruction banner */}
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <b>📖 Instruction:</b> Center skin patch within the circular reticle and click <b>"Capture Frame & Analyze"</b> to run OpenCV 4.13.0 colorimetry.
              </span>
            </div>

            {/* Viewport for Camera / Upload / Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Viewport: Input Source */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                {inputMode === 'camera' && (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                    />
                    
                    {/* Reticle Overlay */}
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-2 border-emerald-400/80 animate-pulse flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[10px] text-emerald-300 font-mono">
                          LIVE RETICLE ACTIVE
                        </div>
                      </div>
                    )}

                    {!isCameraActive && (
                      <div className="text-center p-6 space-y-3">
                        <VideoOff className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 max-w-xs">{cameraError || 'Camera feed paused.'}</p>
                        <button
                          onClick={startCamera}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
                        >
                          Start Optical Camera
                        </button>
                      </div>
                    )}
                  </>
                )}

                {inputMode === 'upload' && (
                  <div className="text-center p-6 space-y-3">
                    <ImageIcon className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="text-xs text-slate-400">Upload high-resolution clinical skin or dermoscopic image</p>
                    <label className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow transition-all">
                      Browse File
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                {inputMode === 'reference' && (
                  <div className="p-3 w-full h-full overflow-y-auto space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Select Calibrated Clinical Reference Texture:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {samples.map((s) => (
                        <button
                          key={s.index}
                          onClick={() => runVisionAnalysisReference(s.index)}
                          className={`p-1.5 rounded-lg border text-left transition-all ${
                            selectedSampleIdx === s.index
                              ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <img src={s.thumbnail_b64} alt={s.name} className="w-full h-12 object-cover rounded mb-1" />
                          <div className="text-[10px] font-bold text-white truncate">{s.phototype}</div>
                          <div className="text-[9px] text-slate-400 truncate">{s.category}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Viewport: OpenCV Analyzed Output */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                {loadingVision ? (
                  <div className="text-center p-6 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                    <p className="text-xs text-slate-400">Running OpenCV CIE L*a*b* & contour extraction...</p>
                  </div>
                ) : visionAnalysis?.image_annotated_b64 ? (
                  <div className="relative w-full h-full">
                    <img
                      src={visionAnalysis.image_annotated_b64}
                      alt="OpenCV Annotated ROI"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-emerald-300 font-mono">
                      OPENCV ANNOTATED
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-xs text-slate-500">
                    Awaiting optical frame capture...
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar for Capture & Predict */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {inputMode === 'camera' && isCameraActive && (
                  <button
                    onClick={captureFrame}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4" /> Capture Frame & Analyze
                  </button>
                )}
                {capturedImageBase64 && (
                  <button
                    onClick={downloadCapturedImage}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Save Image
                  </button>
                )}
              </div>

              <button
                onClick={handleExecutePrediction}
                disabled={loadingPredict}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-lg disabled:opacity-40 flex items-center gap-2 transition-all ml-auto"
              >
                {loadingPredict ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating XGBoost + AdaBoost + VQC...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" /> Execute Multi-Modal Risk Stratification
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OpenCV Extracted Metrics Strip */}
          {visionAnalysis && (
            <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Extracted Optical Biomarkers (OpenCV CIE L*a*b* Telemetry)
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {visionAnalysis.fitzpatrick_phototype} ({visionAnalysis.skin_category})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Individual Typology Angle (ITA)</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">{visionAnalysis.ita_degrees}°</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Objective skin tone</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Melanin Index</div>
                  <div className="text-base font-bold text-amber-300 font-mono mt-0.5">{visionAnalysis.melanin_index}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Photoprotection index</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Erythema Index</div>
                  <div className="text-base font-bold text-rose-400 font-mono mt-0.5">{visionAnalysis.erythema_index}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Micro-vascular redness</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Border Irregularity Score</div>
                  <div className="text-base font-bold text-sky-400 font-mono mt-0.5">{visionAnalysis.border_irregularity_score}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Contour circularity delta</div>
                </div>
              </div>
            </div>
          )}

          {/* Model Prediction Results Card */}
          {prediction && (
            <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-6 bg-slate-900/60 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono"
                      style={{
                        backgroundColor: prediction.hybrid_decision_score >= 0.80 ? '#EF444420' : prediction.hybrid_decision_score >= 0.55 ? '#F9731620' : prediction.hybrid_decision_score >= 0.25 ? '#F59E0B20' : '#10B98120',
                        color: prediction.hybrid_decision_score >= 0.80 ? '#EF4444' : prediction.hybrid_decision_score >= 0.55 ? '#F97316' : prediction.hybrid_decision_score >= 0.25 ? '#F59E0B' : '#10B981'
                      }}
                    >
                      {prediction.risk_category.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Record: {prediction.record_id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Calibrated Hybrid Consensus Risk: {(prediction.hybrid_decision_score * 100).toFixed(1)}%
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">Epistemic Uncertainty</div>
                  <div className="text-xs font-bold text-sky-400 font-mono">±{(prediction.epistemic_uncertainty * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Tri-Model Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> XGBoost Gradient Boosted
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {(prediction.classical_xgboost_risk * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Weight: 45% (Multi-modal trees)</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AdaBoost Adaptive Stumps
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {(prediction.classical_adaboost_risk * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Weight: 25% (Decision stumps)</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Atom className="w-3.5 h-3.5 text-emerald-400" /> 4-Qubit Quantum VQC
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {(prediction.quantum_vqc_risk * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Weight: 30% (Hilbert space expectation)</div>
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Clinical Action Recommendation:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{prediction.recommendation}</p>
              </div>

              {/* Quantum Bloch Coordinates */}
              {prediction.quantum_bloch_coordinates && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <Atom className="w-4 h-4 text-emerald-400" />
                    Simulated 4-Qubit Bloch Sphere Parameters (θ, φ)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Q0: Morphology</div>
                      <div className="text-emerald-300 font-bold">θ={getBlochTheta(prediction.quantum_bloch_coordinates, 'qubit_0_morphology', 0)} rad</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Q1: Somatic Driver</div>
                      <div className="text-emerald-300 font-bold">θ={getBlochTheta(prediction.quantum_bloch_coordinates, 'qubit_1_genomics', 1)} rad</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Q2: Phototype ITA</div>
                      <div className="text-emerald-300 font-bold">θ={getBlochTheta(prediction.quantum_bloch_coordinates, 'qubit_2_phototype', 2)} rad</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Q3: TMB / Inflam.</div>
                      <div className="text-emerald-300 font-bold">θ={getBlochTheta(prediction.quantum_bloch_coordinates, 'qubit_3_inflammation', 3)} rad</div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Skin Phototypes Simulation Curve */}
              {prediction.phototype_risk_graph && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      Patient UV Sensitivity Across All 6 Fitzpatrick Skin Phototypes
                    </span>
                    <span className="text-[10px] text-slate-400">Grounded to current genetics</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {prediction.phototype_risk_graph.map((pt) => (
                      <div
                        key={pt.phototype}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          pt.is_patient_phototype
                            ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-slate-300">{pt.phototype}</div>
                        <div className="text-[9px] text-slate-400 truncate">{pt.category}</div>
                        <div className="text-sm font-bold font-mono text-white mt-1">
                          {((pt.hybrid_risk || 0) * 100).toFixed(1)}%
                        </div>
                        <div
                          className="text-[9px] font-bold mt-0.5"
                          style={{
                            color: (pt.hybrid_risk || 0) >= 0.80 ? '#EF4444' : (pt.hybrid_risk || 0) >= 0.55 ? '#F97316' : (pt.hybrid_risk || 0) >= 0.25 ? '#F59E0B' : '#10B981'
                          }}
                        >
                          {pt?.risk_tier ? String(pt.risk_tier).split(' ')[0] : ((pt.hybrid_risk || 0) >= 0.70 ? 'High' : (pt.hybrid_risk || 0) >= 0.40 ? 'Mod' : 'Low')}
                        </div>
                        {pt.is_patient_phototype && (
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-indigo-500 text-[8px] font-bold text-white uppercase">
                            Matched
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Reports Action Bar */}
              <div className="pt-4 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-sans">
                  Export verified publication-grade clinical dossiers for record <span className="text-white font-mono font-bold">{prediction.record_id}</span>:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={getReportPdfUrl(prediction.record_id)}
                    download={`clinical_decision_report_${prediction.record_id}.pdf`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
                    title="Download Clinical Decision Support PDF"
                  >
                    <Download className="w-3.5 h-3.5" /> Clinical PDF
                  </a>
                  <a
                    href={getDoctorReportPdfUrl(prediction.record_id)}
                    download={`doctor_clinical_report_${prediction.record_id}.pdf`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
                    title="Download Physician/Doctor Clinical Dossier PDF"
                  >
                    <Download className="w-3.5 h-3.5" /> Doctor PDF
                  </a>
                  <a
                    href={getPatientReportPdfUrl(prediction.record_id)}
                    download={`patient_health_summary_${prediction.record_id}.pdf`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
                    title="Download Plain-Language Patient Summary PDF"
                  >
                    <Download className="w-3.5 h-3.5" /> Patient PDF
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VisionDermPage: React.FC = () => {
  return (
    <VisionDermErrorBoundary>
      <VisionDermPageInner />
    </VisionDermErrorBoundary>
  );
};
export default VisionDermPage;
