import { FileText, Headphones, Globe } from "lucide-react";

export function FeaturesSection() {
  const features = [
    { icon: FileText, title: "전자책", desc: "어디서든 편하게 읽을 수 있는 모던한 리딩 경험." },
    { icon: Headphones, title: "AI 오디오북", desc: "눈이 바쁠 때, 귀로 듣는 고품질 AI 낭독." },
    { icon: Globe, title: "매일 새로운 발견", desc: "다양한 크리에이터의 이야기를 만나보세요." },
  ];

  return (
    <section className="border-y border-gray-50 bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-3">
        {features.map((f, i) => (
          <div key={i} className="group flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-transform group-hover:-translate-y-1">
              <f.icon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
