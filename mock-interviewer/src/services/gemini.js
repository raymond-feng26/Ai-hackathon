import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Strip markdown code fences that Gemini sometimes wraps around JSON
function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function analyzeResumeVsJD(resumeText, jobDescription) {
  const prompt = `You are an expert resume reviewer and career coach.

Analyze this resume against the job description and return a JSON object.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY valid JSON with this exact shape:
{
  "matchScore": <integer 0-100 representing how well the resume matches the JD>,
  "missingKeywords": <array of strings: important skills/keywords in the JD missing from the resume>,
  "strengths": <array of 3-5 strings: specific strengths the candidate has for this role>,
  "suggestedEmphasis": <array of 3-5 strings: actionable tips for the candidate to prepare for this role>,
  "modifications": [
    {
      "section": <string: name of resume section to change>,
      "original": <string: the current text>,
      "recommended": <string: the improved version>,
      "reason": <string: why this change improves ATS/interview chances>
    }
  ]
}

Scoring guide for matchScore (be strict — most resumes should score 40-65):
- 85-100: Near-perfect match. Covers virtually all required and preferred skills, directly relevant experience at the right seniority.
- 70-84: Strong match. Most required skills present, relevant industry experience, few gaps in preferred qualifications.
- 50-69: Moderate match. Some required skills, transferable experience, notable gaps in key requirements or seniority.
- 30-49: Weak match. Few required skills, mostly unrelated experience, significant upskilling needed.
- 0-29: Poor match. Fundamentally different field or level, almost no overlap.

Do NOT inflate scores. A career-changer against a senior role is 35-45. Partial skill overlap at wrong seniority is 50-60. Reserve 85+ for candidates who could be hired with minimal interview.

Respond ONLY with valid JSON, no markdown, no explanation.`;

  try {
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch (err) {
    console.error('Gemini analyzeResumeVsJD error:', err);
    throw new Error('Failed to analyze resume. Please try again.');
  }
}

export async function generateQuestions(resumeText, jobDescription, round) {
  const roundDescriptions = {
    first: 'a first-round behavioral/introductory interview — focus on background, motivation, and soft skills',
    second: 'a second-round technical deep-dive interview — focus on technical skills, problem solving, and past projects',
    final: 'a final-round culture fit / offer-stage interview — focus on values, career goals, and mutual fit',
  };

  const roundContext = roundDescriptions[round] || roundDescriptions.first;

  const prompt = `You are an expert interviewer preparing questions for ${roundContext}.

Use the candidate's resume and the job description to create 5 highly relevant, specific interview questions tailored to this candidate and role.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY a JSON array of exactly 5 question strings. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]

Respond ONLY with valid JSON, no markdown, no explanation.`;

  try {
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch (err) {
    console.error('Gemini generateQuestions error:', err);
    throw new Error('Failed to generate questions. Please try again.');
  }
}

export async function gradeAnswer(question, answer, round) {
  const prompt = `You are an expert interview coach grading a candidate's interview answer.

INTERVIEW ROUND: ${round}
QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}

Grade this answer and return ONLY a JSON object with this exact shape:
{
  "score": <integer 1-10>,
  "feedback": <string: 1-2 sentence overall assessment>,
  "strengths": <array of 2-3 strings: specific things the candidate did well>,
  "weaknesses": <array of 1-3 strings: specific areas that could be improved>,
  "suggestions": <array of 1-2 strings: concrete, actionable tips to improve the answer>
}

Scoring guide (be strict and realistic — most answers should score 5-7):
- 9-10: Truly exceptional. Quantified outcomes, perfect structure (STAR or equivalent), insightful depth, nothing missing.
- 7-8: Good. Solid content, specific examples, minor gaps in depth or metrics.
- 5-6: Average. Some relevant content but lacks specifics, structure, or measurable results.
- 3-4: Weak. Vague, generic, or off-topic. Missing examples or concrete detail.
- 1-2: Poor. Barely addresses the question.

Do NOT inflate scores. A competent but unexceptional answer is a 6. Reserve 9+ for answers that would genuinely impress a senior interviewer.

Respond ONLY with valid JSON, no markdown, no explanation.`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = parseJSON(result.response.text());
    return {
      ...parsed,
      improvements: parsed.weaknesses, // backward compatibility alias
    };
  } catch (err) {
    console.error('Gemini gradeAnswer error:', err);
    throw new Error('Failed to grade answer. Please try again.');
  }
}

export async function analyzeInterview(audioBase64, mimeType) {
  const prompt = `You are an expert interview coach analyzing a recorded interview.

Listen to this interview recording and evaluate the candidate's performance. Return ONLY a JSON object with this exact shape:
{
  "transcriptionSummary": <string: 3-5 sentence summary of what was discussed in the interview>,
  "overallScore": <integer 1-10>,
  "strengths": <array of 3-5 strings: specific things the candidate did well>,
  "weaknesses": <array of 3-5 strings: specific areas for improvement>,
  "suggestions": <array of 2-3 strings: concrete, actionable tips>,
  "fillerWordCount": <integer: estimated count of filler words like um, uh, like, you know, so>,
  "keyTopics": <array of 3-7 strings: main topics or skills discussed>
}

Scoring guide (be strict — most candidates score 5-7):
- 9-10: Exceptional. Fluent, confident, highly specific answers with quantified outcomes, zero rambling.
- 7-8: Good. Clear answers, relevant examples, minor filler words or vagueness.
- 5-6: Average. Adequate answers but noticeable filler words, some vagueness, or missed opportunities.
- 3-4: Weak. Significant filler words, unclear answers, or failure to address questions directly.
- 1-2: Poor. Incoherent, extremely nervous, or barely responsive.

Respond ONLY with valid JSON, no markdown, no explanation.`;

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType, data: audioBase64 } },
      { text: prompt },
    ]);
    return parseJSON(result.response.text());
  } catch (err) {
    console.error('Gemini analyzeInterview error:', err);
    throw new Error('Failed to analyze recording. Make sure the file is under 15 minutes and try again.');
  }
}
