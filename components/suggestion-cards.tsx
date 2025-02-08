import { FileText, MessageCircle, TrendingUp, Zap } from "lucide-react"

export function SuggestionCards() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-8 grid grid-cols-2 gap-4">
      <button className="flex items-center gap-2 p-4 rounded-xl border hover:bg-accent transition-colors text-left">
        <FileText className="w-5 h-5 text-red-400" />
        <span>快来看看你的《年度认知天赋报告》！</span>
      </button>
      <button className="flex items-center gap-2 p-4 rounded-xl border hover:bg-accent transition-colors text-left">
        <MessageCircle className="w-5 h-5 text-pink-400" />
        <span>强化学习新突破：NVOA k1.5模型展现卓越推理能力</span>
      </button>
      <button className="flex items-center gap-2 p-4 rounded-xl border hover:bg-accent transition-colors text-left">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <span>A股春季行情解析</span>
      </button>
      <button className="flex items-center gap-2 p-4 rounded-xl border hover:bg-accent transition-colors text-left">
        <Zap className="w-5 h-5 text-green-400" />
        <span>流感肺炎为什么致命</span>
      </button>
    </div>
  )
}

