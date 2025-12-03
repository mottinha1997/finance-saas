import {
  Button,
  Container,
  render,
  Text,
  Textbox,
  VerticalSpace,
  Divider,
  Banner,
  SegmentedControl,
  SegmentedControlOption,
  Dropdown,
  DropdownOption
} from '@create-figma-plugin/ui';
import { emit, on } from '@create-figma-plugin/utilities';
import { h, JSX } from 'preact';
import { useState, useEffect } from 'preact/hooks';

// --- ABA GERADOR ---
function TabGerador(props: { 
  topic: string; 
  setTopic: (v: string) => void;
  angle: string;
  setAngle: (v: string) => void;
  reference: string;
  setReference: (v: string) => void;
  isLoading: boolean; 
  onGenerate: () => void; 
}) {
  
  // Opções de Ângulo de Ataque
  const angleOptions: Array<DropdownOption> = [
    { value: 'Tecnico', text: '🧠 Análise Técnica (Padrão)' },
    { value: 'Critica', text: '📢 Crítica Social / Sistema' },
    { value: 'Polemica', text: '🔥 Polêmica / Unpopular Opinion' },
    { value: 'Reflexao', text: '🤔 Reflexão Filosófica' },
    { value: 'Bastidores', text: '🕵️ Bastidores / O que ninguém vê' }
  ];

  return (
    <div>
      <VerticalSpace space="large" />
      
      <Text style={{fontWeight: 'bold'}}>1. Título do Estudo</Text>
      <VerticalSpace space="small" />
      <Textbox
        onInput={(e) => props.setTopic(e.currentTarget.value)}
        value={props.topic}
        placeholder="Ex: A queda do alcance no Instagram..."
        variant="border"
        disabled={props.isLoading}
      />
      
      <VerticalSpace space="large" />

      <Text style={{fontWeight: 'bold'}}>2. Ângulo da Abordagem</Text>
      <VerticalSpace space="small" />
      <Dropdown
        options={angleOptions}
        value={props.angle}
        onChange={(e) => props.setAngle(e.currentTarget.value)}
        variant="border"
        disabled={props.isLoading}
      />

      <VerticalSpace space="large" />

      <Text style={{fontWeight: 'bold'}}>3. Material de Estudo (Dados/Texto)</Text>
      <VerticalSpace space="small" />
      <Text style={{color: '#666', fontSize: '11px', marginBottom: '6px'}}>
        Cole o conteúdo bruto aqui para a IA analisar sob o ângulo escolhido.
      </Text>
      
      <textarea
        onInput={(e) => props.setReference(e.currentTarget.value)}
        value={props.reference}
        placeholder="Cole o texto base aqui..."
        disabled={props.isLoading}
        rows={6}
        style={{
          width: '100%',
          border: '1px solid #e5e5e5',
          borderRadius: '2px',
          padding: '8px',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          resize: 'vertical',
          minHeight: '100px'
        }}
      />

      <VerticalSpace space="extraLarge" />
      
      <Button fullWidth onClick={props.onGenerate} loading={props.isLoading}>
        {props.isLoading ? 'Analisando e Escrevendo...' : 'Gerar Estudo de Caso 🚀'}
      </Button>
      
      <VerticalSpace space="medium" />
    </div>
  );
}

// --- ABA CONFIGURAÇÃO (Mantida) ---
function TabConfig(props: {
  geminiKey: string;
  setGeminiKey: (v: string) => void;
  pexelsKey: string;
  setPexelsKey: (v: string) => void;
  onSave: () => void;
  status: string;
}) {
  return (
    <div>
      <VerticalSpace space="large" />
      <Text>Google Gemini API Key</Text>
      <VerticalSpace space="small" />
      <Textbox
        onInput={(e) => props.setGeminiKey(e.currentTarget.value)}
        value={props.geminiKey}
        password={true}
        variant="border"
        placeholder="AIza..."
      />
      <VerticalSpace space="large" />
      <Text>Pexels API Key</Text>
      <VerticalSpace space="small" />
      <Textbox
        onInput={(e) => props.setPexelsKey(e.currentTarget.value)}
        value={props.pexelsKey}
        password={true}
        variant="border"
        placeholder="Chave do Pexels"
      />
      <VerticalSpace space="large" />
      
      {props.status === 'sucesso' && <Banner icon={null} variant="success">Salvo! ✅</Banner>}
      
      <VerticalSpace space="small" />
      <Button fullWidth onClick={props.onSave} secondary>Salvar Chaves</Button>
    </div>
  );
}

// --- APP PRINCIPAL ---
function Plugin() {
  const [activeTab, setActiveTab] = useState<string>('gerador');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [pexelsKey, setPexelsKey] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  
  // Inputs do Gerador
  const [topic, setTopic] = useState<string>('');
  const [angle, setAngle] = useState<string>('Tecnico'); // Valor padrão
  const [reference, setReference] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    on('KEYS_LOADED', (data: { gemini: string; pexels: string }) => {
      setGeminiKey(data.gemini);
      setPexelsKey(data.pexels);
      if (!data.gemini || !data.pexels) setActiveTab('config');
    });
    emit('CHECK_KEYS');
    
    return on('GENERATION_COMPLETE', () => {
      setIsLoading(false);
    });
  }, []);

  function handleSaveConfig() {
    emit('SAVE_KEYS', { gemini: geminiKey, pexels: pexelsKey });
    setStatus('sucesso');
    setTimeout(() => setStatus(''), 3000);
  }

  function handleGenerate() {
    if (!topic) return;
    setIsLoading(true);
    // Enviamos o 'angle' junto agora
    emit('GENERATE_CAROUSEL', { topic, angle, reference, geminiKey, pexelsKey });
  }

  function handleTabChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    setActiveTab(event.currentTarget.value);
  }

  const navOptions: Array<SegmentedControlOption> = [
    { value: 'gerador', children: 'Estudo' },
    { value: 'config', children: 'Config' }
  ];

  return (
    <Container space="medium">
      <VerticalSpace space="small" />
      <SegmentedControl options={navOptions} value={activeTab} onChange={handleTabChange} />
      <Divider />
      
      {activeTab === 'gerador' && (
        <TabGerador 
          topic={topic} 
          setTopic={setTopic}
          angle={angle}
          setAngle={setAngle}
          reference={reference}
          setReference={setReference}
          isLoading={isLoading} 
          onGenerate={handleGenerate} 
        />
      )}

      {activeTab === 'config' && (
        <TabConfig 
          geminiKey={geminiKey} 
          setGeminiKey={setGeminiKey} 
          pexelsKey={pexelsKey} 
          setPexelsKey={setPexelsKey} 
          onSave={handleSaveConfig} 
          status={status}
        />
      )}
    </Container>
  );
}

export default render(Plugin);