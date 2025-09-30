# 📅 Sistema de Agendamento de Plantão

Um sistema web completo para organização de escalas de plantão, permitindo que plantonistas indiquem sua disponibilidade e administradores organizem automaticamente a escala final.

## 🚀 Funcionalidades

### ✨ Principais Recursos
- **Configuração Flexível**: Escolha qualquer mês e ano
- **Gestão de Plantonistas**: Adicione/remova plantonistas facilmente
- **Seleção de Disponibilidade**: Interface intuitiva de calendário
- **Validação Automática**: Mínimo de 10 dias por plantonista
- **Organização Automática**: Algoritmo inteligente de distribuição
- **Múltiplos Formatos de Exportação**: PDF, Excel e Texto
- **Armazenamento Local**: Dados salvos automaticamente no navegador
- **Design Responsivo**: Funciona em desktop e mobile

### 🎯 Fluxo de Trabalho
1. **Configuração**: Selecione mês/ano e adicione plantonistas
2. **Disponibilidade**: Cada plantonista seleciona seus dias disponíveis
3. **Organização**: Sistema gera escala automaticamente
4. **Exportação**: Baixe a escala em diferentes formatos

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design moderno com gradientes e animações
- **JavaScript ES6+**: Lógica de negócio e interatividade
- **Font Awesome**: Ícones profissionais
- **jsPDF**: Geração de PDFs
- **SheetJS**: Exportação para Excel
- **LocalStorage**: Persistência de dados

## 📦 Instalação

### Opção 1: GitHub Pages (Recomendado)
1. Faça fork deste repositório
2. Vá em Settings > Pages
3. Selecione "Deploy from a branch"
4. Escolha "main" branch
5. Acesse: `https://seuusuario.github.io/plantao-agendamento`

### Opção 2: Download Local
1. Baixe todos os arquivos
2. Abra `index.html` em qualquer navegador moderno

## 🎨 Personalização

### Cores e Tema
Edite as variáveis CSS em `styles.css`:
```css
/* Gradientes principais */
--primary-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
--success-gradient: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);