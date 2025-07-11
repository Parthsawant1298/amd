
export default function PricingPlans() {
  const plans = [
    {
      name: "Starter",
      price: "$9",
      period: "/mo",
      billing: "billed yearly",
      billingNote: "or $12 billed monthly",
      buttonText: "Get Started",
      buttonColor: "bg-green-500 hover:bg-green-600",
      popular: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "/mo",
      billing: "billed yearly",
      billingNote: "or $35 billed monthly",
      buttonText: "Get Started",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$59",
      period: "/mo",
      billing: "billed yearly",
      billingNote: "or $69 billed monthly",
      buttonText: "Contact Sales",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
      popular: false,
    },
    {
      name: "Custom",
      price: "Contact us",
      period: "",
      billing: "for the specifics",
      billingNote: "",
      buttonText: "Ask Us",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700",
      popular: false,
    },
  ]

  const topFeatures = [
    { name: "AI-Powered Event Scheduling", starter: "Unlimited", professional: "Unlimited", enterprise: "Unlimited", custom: "Unlimited" },
    { name: "Google Calendar Integration", starter: "Yes", professional: "Yes", enterprise: "Yes", custom: "Yes" },
    { name: "Automated Reminders & Notifications", starter: "Yes", professional: "Yes", enterprise: "Yes", custom: "Custom" },
    { name: "Natural Language Event Creation", starter: "Yes", professional: "Yes", enterprise: "Yes", custom: "Custom" },
    { name: "Team Collaboration", starter: "1 user", professional: "5 users", enterprise: "25 users", custom: "Unlimited" },
    { name: "Priority Support", starter: "Email", professional: "Email & Chat", enterprise: "24/7 Support", custom: "Dedicated" },
    { name: "Advanced Analytics & Insights", starter: "Basic", professional: "Advanced", enterprise: "Enterprise", custom: "Custom" },
    { name: "Custom Integrations", starter: "-", professional: "-", enterprise: "Yes", custom: "Custom" },
  ]

  return (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 leading-tight">
            Pricing Plans
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            Choose the perfect plan for your AI-powered scheduling needs. From individuals to enterprises, SmartCalendarAI helps you automate, organize, and optimize your time.
          </p>
        </div>

        {/* Most Popular Badge */}
        <div className="flex justify-center mb-2">
          <div className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-full text-sm font-semibold tracking-wide">
            MOST POPULAR
          </div>
        </div>

        {/* Mobile Plans Layout */}
        <div className="block lg:hidden space-y-6 mb-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg p-6 ${plan.popular ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
            >
              <div className="text-center">
                <h3 className={`text-xl font-bold mb-4 ${plan.popular ? "text-blue-600" : "text-gray-800"}`}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-800">{plan.price}</span>
                  <span className="text-gray-500 text-lg">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{plan.billing}</p>
                {plan.billingNote && <p className="text-xs text-gray-500 mb-6">{plan.billingNote}</p>}
                <button
                  className={`w-full ${plan.buttonColor} text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Pricing Section */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="grid grid-cols-5 min-h-[400px]">
            {/* Left Column - Choose your plan */}
            <div className="bg-gray-100 p-8 flex items-center justify-center border-r border-gray-200">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                  Choose
                  <br />
                  your plan
                </h2>
              </div>
            </div>

            {/* Pricing Cards */}
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`p-8 text-center border-r border-gray-200 last:border-r-0 flex flex-col justify-between ${plan.popular ? "bg-blue-50" : "bg-white"}`}
              >
                <div>
                  <h3 className={`text-xl font-bold mb-6 ${plan.popular ? "text-blue-600" : "text-gray-800"}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-800">{plan.price}</span>
                    <span className="text-gray-500 text-lg">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{plan.billing}</p>
                  {plan.billingNote && <p className="text-xs text-gray-500 mb-8">{plan.billingNote}</p>}
                </div>
                <button
                  className={`w-full ${plan.buttonColor} text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Features Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Top Features Section */}
          <div className="bg-gray-100 px-4 sm:px-8 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Top features</h3>
          </div>

          {/* Mobile Features Layout */}
          <div className="block lg:hidden">
            {topFeatures.map((feature, index) => (
              <div key={index} className="border-b border-gray-200 last:border-b-0 p-4">
                <div className="flex items-center mb-3">
                  <span className="font-medium text-gray-800">{feature.name}</span>
                  <div className="ml-2 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">?</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Starter</div>
                    <div className="text-gray-700">{feature.starter}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Professional</div>
                    <div className="text-gray-700">{feature.professional}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Enterprise</div>
                    <div className="text-gray-700">{feature.enterprise}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Custom</div>
                    <div className="text-gray-700">{feature.custom}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Features Layout */}
          <div className="hidden lg:block">
            {topFeatures.map((feature, index) => (
              <div
                key={index}
                className="grid grid-cols-5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="px-8 py-4 bg-gray-50 font-medium text-gray-800 border-r border-gray-200 flex items-center">
                  <span>{feature.name}</span>
                  <div className="ml-2 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">?</span>
                  </div>
                </div>
                <div className="px-8 py-4 text-center text-gray-700 border-r border-gray-200 flex items-center justify-center">
                  {feature.starter}
                </div>
                <div className="px-8 py-4 text-center text-gray-700 border-r border-gray-200 flex items-center justify-center">
                  {feature.professional}
                </div>
                <div className="px-8 py-4 text-center text-gray-700 border-r border-gray-200 flex items-center justify-center">
                  {feature.enterprise}
                </div>
                <div className="px-8 py-4 text-center text-gray-700 flex items-center justify-center">
                  {feature.custom}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}