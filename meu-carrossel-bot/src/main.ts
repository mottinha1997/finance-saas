import { on, showUI, emit } from '@create-figma-plugin/utilities';

export default function () {
  
  // --- 1. CONFIGURAÇÃO ---
  on('SAVE_KEYS', async (data: { gemini: string; pexels: string }) => {
    await figma.clientStorage.setAsync('gemini_key', data.gemini);
    await figma.clientStorage.setAsync('pexels_key', data.pexels);
    figma.notify('Configurações salvas! 🔒');
  });

  on('CHECK_KEYS', async () => {
    const gemini = await figma.clientStorage.getAsync('gemini_key');
    const pexels = await figma.clientStorage.getAsync('pexels_key');
    emit('KEYS_LOADED', { gemini: gemini || '', pexels: pexels || '' });
  });

  // --- 2. GERAÇÃO (COM ÂNGULOS DEFINIDOS) ---
  on('GENERATE_CAROUSEL', async (data: { topic: string; angle: string; reference: string; geminiKey: string; pexelsKey: string }) => {
    
    // Validações
    if (!data.geminiKey || data.geminiKey.trim() === '') {
      figma.notify('❌ Chave do Gemini vazia!', { error: true });
      emit('GENERATION_COMPLETE');
      return;
    }

    if (figma.currentPage.selection.length === 0) {
      figma.notify('❌ Selecione os frames primeiro!', { error: true });
      emit('GENERATION_COMPLETE');
      return;
    }

    const selection = figma.currentPage.selection;
    const slideCount = selection.length;
    
    figma.notify(`🔍 Analisando sob a ótica: ${data.angle}...`);

    try {
      // --- DEFINIÇÃO DOS ÂNGULOS DE ATAQUE ---
      let angleInstruction = "";
      
      switch (data.angle) {
        case 'Critica':
          angleInstruction = "Foco: CRÍTICA SOCIAL E SISTÊMICA. Questione as estruturas de poder, o capitalismo ou as normas da indústria. Mostre quem ganha e quem perde. Seja ácido e revelador.";
          break;
        case 'Polemica':
          angleInstruction = "Foco: POLÊMICA / UNPOPULAR OPINION. Diga o que ninguém tem coragem de dizer. Contraria o senso comum. Use frases provocativas para gerar debate imediato.";
          break;
        case 'Reflexao':
          angleInstruction = "Foco: REFLEXÃO FILOSÓFICA. Olhe para dentro. Analise o comportamento humano por trás dos dados. Use um tom calmo, profundo e existencial.";
          break;
        case 'Bastidores':
          angleInstruction = "Foco: INVESTIGATIVO. Revele o que acontece por trás das cortinas. Fale de erros, estratégias ocultas e verdades nuas e cruas.";
          break;
        default: // Tecnico
          angleInstruction = "Foco: ANÁLISE TÉCNICA E PRÁTICA. Seja um professor especialista. Foco em dados, fatos, método e resultado. Sem emoção, pura competência.";
      }

      // --- PROMPT FINAL ---
      let instructions = `
        Atue como um Estrategista de Conteúdo Sênior.
        Objetivo: Criar um Estudo de Caso Denso (${slideCount} slides) sobre: "${data.topic}".
        
        DIRETRIZ DE ÂNGULO OBRIGATÓRIA:
        ${angleInstruction}

        MATERIAL DE ESTUDO (Contexto):
        """
        ${data.reference || "Sem referência. Use seu conhecimento profundo."}
        """
        
        REGRAS DE DENSIDADE (NÃO QUEBRE):
        1. TEXTO LONGO E DENSO: Proibido textos rasos. Desenvolva argumentos complexos.
        2. ESTRUTURA: Cada slide deve ter título + um corpo de texto robusto (40-80 palavras).
        3. AIDA ADAPTADO:
           - Slide 1: Gancho forte alinhado ao ângulo escolhido.
           - Meio: Desenvolvimento profundo da tese.
           - Fim: CTA de debate (ex: "Discorda?").

        FORMATO JSON:
        [
          {
            "title": "Titulo Impactante",
            "body": "Texto denso e bem formatado com \\n",
            "image_search": "keyword visual em ingles focada em fotografia high-end e estilo pinterest (ex: 'minimalist beige architecture', 'cinematic portrait moody lighting', 'abstract tech texture')"
          }
        ]
      `;

      // Chamada API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${data.geminiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: instructions }]
          }]
        })
      });

      const jsonResponse = await response.json();

      if (jsonResponse.error) throw new Error(`Erro Gemini: ${jsonResponse.error.message}`);

      let rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Sem resposta válida.");

      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const contentList = JSON.parse(rawText);

      // --- POPULAR O FIGMA ---
      for (let i = 0; i < selection.length; i++) {
        const node = selection[i];
        const content = contentList[i] || contentList[contentList.length - 1]; 

        const titleNode = findNodeByName(node, '#titulo') as TextNode;
        const bodyNode = findNodeByName(node, '#texto') as TextNode;
        const imgNode = findNodeByName(node, '#imagem');

        if (titleNode && titleNode.type === 'TEXT') {
          await loadFont(titleNode);
          titleNode.characters = content.title;
        }

        if (bodyNode && bodyNode.type === 'TEXT') {
          await loadFont(bodyNode);
          bodyNode.characters = content.body;
          bodyNode.textAutoResize = 'HEIGHT'; 
        }

        if (imgNode && (imgNode.type === 'RECTANGLE' || imgNode.type === 'FRAME')) {
           if (data.pexelsKey) {
             const imageUrl = await searchPexelsImage(content.image_search, data.pexelsKey);
             if (imageUrl) {
               const imageBytes = await fetchImageBytes(imageUrl);
               const imagePaint = figma.createImage(imageBytes);
               imgNode.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: imagePaint.hash }];
             }
           }
        }
      }

      figma.notify('✅ Estudo de Caso Gerado!');

    } catch (err: any) {
      console.error(err);
      figma.notify(`Erro: ${err.message}`, { error: true });
    } finally {
      emit('GENERATION_COMPLETE');
    }
  });

  showUI({ height: 600, width: 360 }); // Ajuste final de tamanho
}

// --- HELPERS ---
function findNodeByName(root: SceneNode, name: string): SceneNode | null {
  if (root.name === name) return root;
  if ('children' in root) {
    for (const child of root.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

async function loadFont(textNode: TextNode) {
  const fontName = textNode.fontName as FontName;
  if (typeof fontName !== 'symbol') { 
    await figma.loadFontAsync(fontName);
  }
}

async function searchPexelsImage(query: string, apiKey: string): Promise<string | null> {
  if (!apiKey) return null;
  try {
    // Adicionei '&size=large' para garantir qualidade
    // O Pexels busca melhor se a query for simples, então o Gemini deve caprichar nas keywords
    const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=portrait&size=large`, {
      headers: { 'Authorization': apiKey }
    });
    const json = await res.json();
    
    // Tenta pegar a imagem 'large2x' (altíssima qualidade) ou 'large'
    if (json.photos && json.photos.length > 0) {
      return json.photos[0].src.large2x || json.photos[0].src.large;
    }
    return null;
  } catch (e) {
    console.error("Erro Pexels", e);
    return null;
  }
}

async function fetchImageBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const buffer =