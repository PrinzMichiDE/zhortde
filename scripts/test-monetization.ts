import { monetizeUrl } from '../lib/monetization';

// Simple mock test runner since we might not have jest setup properly for standalone run easily in this environment without config
// I'll just write a script that runs and logs output.

async function testMonetization() {
  const testCases = [
    {
      input: 'https://google.com',
      expected: 'https://google.com/', // URL normalization adds slash
      desc: 'Non-Amazon URL should be unchanged'
    },
    {
      input: 'https://www.amazon.de/dp/B0855L3151',
      expectedContains: ['tag=michelfritzschde-21', 'linkCode=ll2', 'language=de_DE', 'ref_=as_li_ss_tl'],
      desc: 'Amazon.de product link'
    },
    {
      input: 'https://amazon.com/some-product',
      expectedContains: ['tag=michelfritzschde-21', 'linkCode=ll2', 'ref_=as_li_ss_tl'],
      desc: 'Amazon.com link'
    },
    {
      input: 'https://www.amazon.de?existing=param',
      expectedContains: ['tag=michelfritzschde-21', 'existing=param'],
      desc: 'Amazon link with existing params'
    }
  ];

  let failures = 0;

  for (const tc of testCases) {
    const result = monetizeUrl(tc.input);
    
    if (tc.expected && result !== tc.expected && result !== tc.input) { // Allow input if normalization matches
         // URL constructor might change string slightly (trailing slash)
         if (new URL(result).toString() !== new URL(tc.expected).toString()) {
            console.error(`FAILED: ${tc.desc}`);
            console.error(`  Input: ${tc.input}`);
            console.error(`  Expected: ${tc.expected}`);
            console.error(`  Got: ${result}`);
            failures++;
         }
    } else if (tc.expectedContains) {
        const missing: string[] = [];
        for (const str of tc.expectedContains) {
            if (!result.includes(str)) missing.push(str);
        }
        if (missing.length > 0) {
            console.error(`FAILED: ${tc.desc}`);
            console.error(`  Input: ${tc.input}`);
            console.error(`  Got: ${result}`);
            console.error(`  Missing: ${missing.join(', ')}`);
            failures++;
        }
    } else if (result !== tc.input && new URL(result).toString() !== new URL(tc.input).toString()) {
         // Default check: if no expected set, assumes equality? No, wait. 
         // First case covers equality.
    }
  }

  if (failures === 0) {
    console.log('All monetization tests passed!');
  } else {
    console.error(`${failures} tests failed.`);
    process.exit(1);
  }
}

testMonetization();
