const GhidRapid = ({ steps, title = '📚 Ghid Rapid' }: any) => (
  <main className="p-6 bg-white m-4 rounded-lg shadow-lg">
    <div className="mt-4 w-80">
      <h2 className="text-xl font-semibold text-black mb-4">{title}</h2>
      <ol className="list-decimal list-inside space-y-2 text-black">
        {steps.map((step: any, index: any) => (
          <li key={index} className="flex items-center">
            {step.icon && <span className="mr-2">{step.icon} {step.text}</span>}
          </li>
        ))}
      </ol>
    </div>
  </main>
);

export default GhidRapid
