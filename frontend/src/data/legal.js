// Draft legal text. Replace these details and have a lawyer review before launch.
export const ORG = {
  app: '[APP NAME]',
  owner: '[COMPANY OR OWNER NAME]',
  address: '[REGISTERED ADDRESS]',
  email: '[SUPPORT EMAIL]',
  effective: '[EFFECTIVE DATE]',
};

const o = ORG;

export const LEGAL = {
  'Privacy policy': {
    updated: o.effective,
    intro: `This policy explains how ${o.owner} handles information you provide through ${o.app}.`,
    sections: [
      { h: 'Information and use', p: [
        'We collect your account and profile details, health and diet information, diet-plan progress, messages, and notification data.',
        'We use this information to provide and improve your diet service, respond to you, send relevant notifications, and protect the app.',
      ] },
      { h: 'Sharing and storage', p: [
        'Only authorised people and service providers needed to run the app may access your information. We do not sell your personal information.',
        'We keep your information while your account is active. You may request deletion through Profile.',
      ] },
      { h: 'Your choices and contact', p: [
        `You can update your profile, manage notifications, or request account deletion in the app. For privacy questions or requests, contact ${o.email}.`,
      ] },
    ],
  },

  'Terms of use': {
    updated: o.effective,
    intro: `These terms cover your use of ${o.app}, operated by ${o.owner}. By using the app, you agree to them.`,
    sections: [
      { h: 'Using the app', p: [
        'Provide accurate information, keep your account secure, and use the app lawfully and respectfully.',
        'The app provides general diet guidance, not medical advice or emergency care. Talk to a healthcare professional about medical concerns or before making significant diet changes.',
      ] },
      { h: 'Plans and account', p: [
        'Diet plans are personal, may not suit everyone, and do not guarantee results. Check food labels and ingredients, especially if you have allergies.',
        'You may request account deletion in Profile. We may suspend access for misuse or a serious breach of these terms.',
      ] },
      { h: 'Contact', p: [
        `Contact ${o.email} with questions about these terms.`,
      ] },
    ],
  },

  'Medical disclaimer': {
    updated: o.effective,
    intro: `${o.app} provides general diet guidance and does not diagnose, treat, or prevent medical conditions.`,
    sections: [
      { h: 'Your health', p: [
        'Speak with a doctor before following a diet plan if you have a medical condition, take medication, are pregnant or breastfeeding, or have a serious allergy.',
        'Check ingredients and food labels yourself. Stop if you feel unwell and seek medical help. The app is not for emergencies.',
      ] },
    ],
  },

  'Consent notice': {
    updated: o.effective,
    intro: `By using ${o.app}, you agree to the collection and use of information needed to provide your diet service.`,
    sections: [
      { h: 'What this means', p: [
        'This may include your account, profile and health-related details, diet plan, messages, and notification data. Authorised people and service providers needed to operate the app may process it.',
        `You may withdraw consent by requesting account deletion in Profile or contacting ${o.email}. We may then be unable to provide the service.`,
      ] },
    ],
  },
};
