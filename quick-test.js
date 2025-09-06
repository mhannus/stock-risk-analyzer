
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Quick API Test');
console.log('================');
console.log('CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
console.log('Key starts with:', process.env.CLAUDE_API_KEY?.substring(0, 20));

async function quickTest() {
  if (!process.env.CLAUDE_API_KEY) {
    console.log('❌ No API key found in environment');
    return;
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    console.log('\n📡 Testing API call...');
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 30,
      messages: [{ role: "user", content: "Say hello" }]
    });

    console.log('✅ SUCCESS:', message.content[0].text);
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Error details:', {
      name: error.name,
      status: error.status,
      type: error.type
    });
  }
}

quickTest();
