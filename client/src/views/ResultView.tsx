import { ArrowLeftIcon } from "../components/icons";
import { MetaGrid } from "../components/MetaGrid";
import { VerdictBadge } from "../components/VerdictBadge";
import { VideoPreview } from "../components/VideoPreview";
import type { Analysis } from "../types/analysis";
import { formatPercent } from "../utils/format";
import "../styles/result.css";

interface ResultViewProps {
    analysis: Analysis;
    onReset: () => void;
}

export function ResultView({ analysis, onReset }: ResultViewProps) {
    const { video, prediction } = analysis;

    return (
        <div className="hero" id="resultHero">
            <VideoPreview file={video.file} />

            <div className="card" id="resultCard">
                <div className="eyebrow">Analysis Result</div>

                <VerdictBadge prediction={prediction.prediction} />

                <div className="confidence-line">Confidence: <b>{formatPercent(prediction.confidence)}</b></div>

                <hr className="divider" />

                <MetaGrid video={video} />

                <button id="resetBtn" onClick={onReset}>
                    Analyze another video
                    <ArrowLeftIcon />
                </button>
            </div>
        </div>
    );
}
