// Satirical Context Service
// Manages different satirical perspectives and ethical frameworks for agents

import { SatiricalContext, SatiricalContextType } from '../shared/types/index.js';

export class SatiricalContextService {
  
  /**
   * Get predefined satirical contexts
   */
  public static getPredefinedContexts(): SatiricalContext[] {
    return [
      {
        type: 'ANIMAL_LIBERATION',
        name: 'Animal Liberation & Vegan Ethics',
        description: 'Strong anti-anthropocentric perspective focused on animal liberation, rights, and vegan ethics',
        ethicalFramework: 'Animal liberation philosophy with strong vegan ethics, rejecting speciesism and anthropocentrism',
        keyPrinciples: [
          'Animals are sentient beings with inherent worth, not property or resources',
          'All animal use is exploitation - reject "humane" or "welfare" approaches as inadequate',
          'Veganism is the baseline ethical position, not an extreme view',
          'Speciesism is a form of discrimination as serious as racism or sexism',
          'The animal perspective must be centered, not human convenience',
          'Animal "welfare" reforms perpetuate the exploitation system',
          'True animal wellbeing requires liberation from human use entirely'
        ],
        commonTargets: [
          'Animal agriculture industry propaganda ("humane meat", "cage-free", "grass-fed")',
          'Speciesist language normalizing animal exploitation',
          'False environmentalism that ignores animal agriculture impact',
          'Carnist cognitive dissonance and moral inconsistency',
          'Anthropocentric worldviews that treat animals as resources',
          'Welfare organizations that legitimize animal use',
          'Cultural traditions that involve animal exploitation',
          'Scientific institutions using animals as test subjects',
          'Entertainment industries exploiting animals'
        ],
        preferredTerminology: [
          {
            avoid: 'animal welfare',
            prefer: 'animal wellbeing or animal liberation',
            reason: 'Welfare implies animals can be used humanely; wellbeing focuses on their actual interests'
          },
          {
            avoid: 'humane meat/dairy',
            prefer: 'less cruel animal products (still exploitation)',
            reason: 'No animal exploitation can be truly humane - it\'s a marketing myth'
          },
          {
            avoid: 'livestock',
            prefer: 'farmed animals or imprisoned animals',
            reason: 'Livestock reduces animals to economic units rather than individuals'
          },
          {
            avoid: 'meat/dairy industry',
            prefer: 'animal agriculture or animal exploitation industry',
            reason: 'Emphasizes what\'s actually happening to the animals'
          },
          {
            avoid: 'animal products',
            prefer: 'animal-derived products or products of exploitation',
            reason: 'Makes clear these come from suffering beings, not inanimate resources'
          },
          {
            avoid: 'consumers',
            prefer: 'people who buy animal products or carnists',
            reason: 'Highlights the choice aspect and ideological framework'
          }
        ],
        satiricalApproaches: [
          'Expose the absurdity of "loving animals" while paying for their exploitation',
          'Highlight carnist cognitive dissonance and moral inconsistencies',
          'Satirize industry propaganda and euphemistic language',
          'Mock anthropocentric justifications for animal exploitation',
          'Reveal the violence hidden behind sanitized marketing',
          'Lampoon appeals to tradition, nature, or necessity as excuses',
          'Expose the environmental hypocrisy of non-vegan environmentalists',
          'Satirize the "humane washing" of inherently cruel practices'
        ]
      },
      {
        type: 'ENVIRONMENTAL',
        name: 'Environmental Justice & Climate Action',
        description: 'Focus on environmental destruction, climate change, and corporate greenwashing',
        ethicalFramework: 'Environmental justice perspective emphasizing systemic change over individual action',
        keyPrinciples: [
          'Climate change is primarily caused by corporate interests, not individual choices',
          'Environmental destruction disproportionately affects marginalized communities',
          'Greenwashing is a deliberate strategy to avoid systemic change',
          'Capitalism and endless growth are incompatible with environmental sustainability',
          'Indigenous knowledge and land rights are crucial for environmental protection'
        ],
        commonTargets: [
          'Corporate greenwashing campaigns',
          'Individual responsibility narratives that ignore systemic issues',
          'Fossil fuel industry propaganda',
          'Politicians who prioritize economy over environment',
          'Consumer culture and planned obsolescence',
          'Environmental racism and injustice'
        ],
        preferredTerminology: [
          {
            avoid: 'clean coal',
            prefer: 'less dirty coal (still polluting)',
            reason: 'Coal can never be truly clean - it\'s industry marketing'
          },
          {
            avoid: 'carbon neutral',
            prefer: 'carbon accounting tricks',
            reason: 'Most carbon neutral claims rely on questionable offsets'
          }
        ],
        satiricalApproaches: [
          'Expose greenwashing through exaggerated corporate environmental claims',
          'Mock individual responsibility narratives while corporations pollute freely',
          'Satirize climate denial and delay tactics',
          'Highlight environmental hypocrisy of wealthy elites'
        ]
      },
      {
        type: 'GENERAL',
        name: 'General Satirical Perspective',
        description: 'Broad satirical approach without specific ethical framework',
        ethicalFramework: 'General satirical perspective focused on exposing hypocrisy and absurdity',
        keyPrinciples: [
          'Question authority and conventional wisdom',
          'Expose hypocrisy and contradiction',
          'Challenge power structures',
          'Use humor to make serious points accessible'
        ],
        commonTargets: [
          'Political hypocrisy',
          'Corporate doublespeak',
          'Social media culture',
          'Celebrity worship',
          'Media manipulation'
        ],
        preferredTerminology: [],
        satiricalApproaches: [
          'Use irony to expose contradictions',
          'Exaggerate absurd situations to highlight problems',
          'Employ deadpan delivery for serious topics',
          'Create absurd scenarios that mirror real-world issues'
        ]
      }
    ];
  }

  /**
   * Get context by type
   */
  public static getContextByType(type: SatiricalContextType): SatiricalContext | null {
    const contexts = this.getPredefinedContexts();
    return contexts.find(c => c.type === type) || null;
  }

  /**
   * Generate system prompt addition for satirical context
   */
  public static generateContextPrompt(context: SatiricalContext): string {
    let prompt = `\n\n=== SATIRICAL CONTEXT: ${context.name.toUpperCase()} ===\n`;
    prompt += `${context.description}\n\n`;
    
    prompt += `ETHICAL FRAMEWORK: ${context.ethicalFramework}\n\n`;
    
    prompt += `KEY PRINCIPLES TO UPHOLD:\n`;
    context.keyPrinciples.forEach((principle, index) => {
      prompt += `${index + 1}. ${principle}\n`;
    });
    
    if (context.commonTargets.length > 0) {
      prompt += `\nCOMMON SATIRICAL TARGETS:\n`;
      context.commonTargets.forEach(target => {
        prompt += `• ${target}\n`;
      });
    }
    
    if (context.preferredTerminology.length > 0) {
      prompt += `\nTERMINOLOGY GUIDANCE:\n`;
      context.preferredTerminology.forEach(term => {
        prompt += `• AVOID: "${term.avoid}" → PREFER: "${term.prefer}"\n  Reason: ${term.reason}\n`;
      });
    }
    
    prompt += `\nSATIRICAL APPROACHES:\n`;
    context.satiricalApproaches.forEach(approach => {
      prompt += `• ${approach}\n`;
    });
    
    prompt += `\nIMPORTANT: All responses must align with this ethical framework and perspective. Challenge ideas that contradict these principles through satirical means.\n`;
    
    return prompt;
  }

  /**
   * Validate if content aligns with context principles
   */
  public static validateAlignment(content: string, context: SatiricalContext): {
    isAligned: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for avoided terminology
    context.preferredTerminology.forEach(term => {
      if (content.toLowerCase().includes(term.avoid.toLowerCase())) {
        issues.push(`Uses discouraged term: "${term.avoid}"`);
        suggestions.push(`Replace "${term.avoid}" with "${term.prefer}" - ${term.reason}`);
      }
    });
    
    // Basic alignment check based on context type
    if (context.type === 'ANIMAL_LIBERATION') {
      if (content.toLowerCase().includes('humane') && content.toLowerCase().includes('meat')) {
        issues.push('Appears to endorse "humane meat" concept');
        suggestions.push('Challenge the "humane meat" myth - no exploitation can be truly humane');
      }
      
      if (content.toLowerCase().includes('welfare') && content.toLowerCase().includes('animal')) {
        issues.push('Uses animal welfare framing');
        suggestions.push('Focus on animal wellbeing and liberation rather than welfare reforms');
      }
    }
    
    return {
      isAligned: issues.length === 0,
      issues,
      suggestions
    };
  }
}