export default function About() {
  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
      <h1 className="text-4xl font-bold mb-8">About EchoTrade</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 transition-all duration-300">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 mb-6">Our Vision</h2>
          <p className="text-zinc-300 leading-relaxed">
            EchoTrade aims to transform the way individuals and institutions engage with the Macedonian Stock Exchange. By leveraging cutting-edge technologies such as machine learning, real-time data analytics, and predictive modeling, EchoTrade empowers users with accurate information to make smarter, data-driven investment choices.
          </p>
        </div>

        <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 transition-all duration-300">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 mb-6">Our Mission</h2>
          <p className="text-zinc-300 leading-relaxed">
            The mission of EchoTrade is to deliver high-quality, actionable insights to the Macedonian stock market, enabling users to understand market trends, forecast stock movements, and optimize their investment strategies. We strive to create a seamless and intuitive experience for all types of users, from beginners to professionals.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold bg-clip-text text-center text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 mb-8">Why EchoTrade?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">Targeted for the Macedonian Market</h3>
            <p className="text-zinc-300 leading-relaxed">
              Unlike global stock platforms, EchoTrade is designed specifically to meet the needs of investors in the Macedonian Stock Exchange, offering localized data and insights.
            </p>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">Advanced Tools with Simplicity</h3>
            <p className="text-zinc-300 leading-relaxed">
              Despite the sophisticated analytics and prediction models, the platform ensures ease of use for all levels of expertise.
            </p>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">Real-Time Insights</h3>
            <p className="text-zinc-300 leading-relaxed">
              With EchoTrade, you gain immediate access to the latest data, empowering faster and more informed decision-making.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700">
        <p className="text-zinc-300 leading-relaxed text-center italic">
          EchoTrade continues to evolve, aiming to bring innovative solutions to the Macedonian financial ecosystem and to foster a more informed and efficient stock market environment.
        </p>
      </div>
    </div>
  );
}