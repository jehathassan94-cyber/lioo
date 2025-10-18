import { GoogleGenAI, Modality } from "@google/genai";

const callGeminiModel = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const candidate = response.candidates?.[0];

    if (!candidate) {
      const blockReason = response.promptFeedback?.blockReason;
      if (blockReason) {
        throw new Error(`تم حظر الطلب من Gemini. السبب: ${blockReason}.`);
      }
      throw new Error("لم يرجع Gemini أي نتائج. قد يكون الطلب قد تم حظره.");
    }
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      const finishReason = candidate.finishReason;
      if (finishReason && finishReason !== 'STOP') {
        throw new Error(`فشل Gemini في إنشاء صورة. السبب: ${finishReason}`);
      }
      throw new Error("فشل في إنشاء الصورة، لم يتم العثور على محتوى في استجابة Gemini.");
    }

    const imagePart = candidate.content.parts.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      const base64ImageBytes: string = imagePart.inlineData.data;
      return `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
    }

    throw new Error("لم يتم العثور على صورة في استجابة Gemini.");

  } catch (error) {
    console.error("Error calling Gemini model:", error);
     if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('مفتاح Gemini API المقدم غير صالح. يرجى الاتصال بمسؤول الموقع.');
        }
        throw error;
    }
    throw new Error("حدث خطأ غير متوقع أثناء معالجة الصورة مع Gemini.");
  }
};


export const enhanceWithGemini = async (base64Image: string, mimeType: string): Promise<string> => {
  const prompt = `Act as a world-class digital artist and photo restoration master. Your task is to take the provided image and not just enhance it, but completely **re-render** it into a new, photorealistic, ultra-high-resolution masterpiece. The goal is to create a new image that looks like it was captured with a state-of-the-art professional camera (like a Hasselblad or Phase One), but it must be an exact likeness of the original subject.

**Core Directives (Absolutely Mandatory):**

1.  **Full Re-creation, Not Filtering:** Do not apply simple filters or sharpening layers. You must analyze the subject's features, textures, and lighting from the input image and generate a **brand new, pristine image** from scratch based on that analysis. The output is a new creation, not a modification.
2.  **Hyper-Realistic Detail Generation:**
    *   **Skin:** Generate realistic skin texture with natural pores, subtle imperfections, and accurate tones. Avoid any plastic or airbrushed appearance.
    *   **Eyes:** Create eyes that are sharp, clear, and full of life. Reconstruct individual eyelashes and add natural reflections (catchlights).
    *   **Hair:** Render individual hair strands with realistic flow, texture, and highlights. Eliminate all blockiness or blur.
3.  **Perfect Likeness (Non-Negotiable):** The final image must be **100% identifiable** as the person in the original photo. Do not alter their facial structure, unique features, expression, clothing, or pose. You are creating a higher-fidelity version of the *exact same moment*.
4.  **Drastic Resolution & Clarity Increase:** The output resolution must be significantly higher than the input. Every element in the new image must be perfectly sharp, in focus, and free of any noise, compression artifacts, or blur.
5.  **Professional Lighting:** Subtly correct and enhance the lighting to appear as if it were shot in a professional studio, but without changing the original mood or direction of light.

Your final output must be a breathtakingly clear and detailed photograph that replaces the low-quality original.`;
  return callGeminiModel(base64Image, mimeType, prompt);
};


export const colorizeWithGemini = async (base64Image: string, mimeType: string): Promise<string> => {
    const prompt = `You are a master studio photographer and professional retoucher. Your task is to analyze and perfect the lighting and color of this photograph as if you were preparing it for a high-end magazine cover. This is not a simple filter; it's an intelligent, adaptive process.

**Your Process:**

1.  **Analyze First:** Before making any changes, critically analyze the existing lighting on the subject. Identify areas that are too bright (overexposed highlights) or too dark (crushed shadows).

2.  **Intelligent Light Correction (The Core Task):**
    *   **Balance and Harmony:** Your primary goal is to achieve perfect lighting balance. If the image has excessive light in some areas, you must intelligently reduce the highlights to recover detail and prevent a washed-out look. Conversely, if parts of the image are too dark, gently lift the shadows to reveal detail without introducing noise.
    *   **Symmetrical Studio Lighting:** Remodel the light to simulate a professional studio with multiple diffused light sources (like large softboxes). The lighting on the subject's face must be exquisitely balanced and symmetrical. The left and right sides of the face should receive a similar quality and quantity of light, eliminating harsh, one-sided shadows and creating a flattering, three-dimensional look.

3.  **Professional Color Grading:**
    *   **Neutral White Balance:** Establish a perfectly neutral white balance. Eradicate any unnatural color casts (e.g., yellow, blue, magenta).
    *   **Rich, Realistic Tones:** Enhance colors to be rich and true-to-life. Skin tones must be rendered with supreme accuracy and look healthy and natural under the new studio lighting. Avoid oversaturation.

4.  **Final Polish:**
    *   Apply a subtle touch of clarity and contrast to make the final image pop, ensuring it looks crisp and professional without appearing artificial.

**Crucial Constraint:**
*   You are a retoucher, not a plastic surgeon. Do **NOT** alter the subject's physical features, facial structure, hair, or the background. Your job is exclusively focused on perfecting light and color. The output must be the same person and scene, just viewed under perfect studio conditions.`;
    return callGeminiModel(base64Image, mimeType, prompt);
};

export const removeBackgroundWithGemini = async (base64Image: string, mimeType: string): Promise<string> => {
    const prompt = `Your task is to act as a precision image editor.
1.  **Identify the primary subject(s)** in the photograph, which will likely be a person or people.
2.  **Create a perfect, clean cutout** of the subject(s). The edges must be sharp and precise, especially around fine details like hair.
3.  **Completely remove the original background.**
4.  **Replace the background with a solid, uniform, pure white color (#FFFFFF).**
5.  **Crucially, do NOT alter the subject in any way.** Their appearance, colors, lighting, and details must remain identical to the input image. You are only changing the background.

The final output should be the original subject(s) on a perfectly white background.`;
    return callGeminiModel(base64Image, mimeType, prompt);
};