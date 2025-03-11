# SummarizeHub

A browser-based article summarization tool that uses WebLLM to run open-source language models directly in your browser. Upload articles in bulk via CSV/XLSX and get AI-generated summaries and tags without sending your data to external servers.

## Features

- 🚀 Browser-based LLM processing - no server required
- 📊 Bulk article processing via CSV/XLSX uploads
- 🔒 Privacy-focused - all processing happens locally
- 📝 Generates concise summaries and relevant tags
- 📋 Interactive data grid for easy content management
- 💾 Export results in XLSX or CSV format

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/summarize-hub.git
cd summarize-hub
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### Summarization Approach

SummarizeHub uses [@mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) to run open-source language models directly in your browser. Currently, it uses the Gemma 2B-IT model (quantized to 4-bit for efficiency) for generating summaries and tags.

Key benefits of this approach:
- **Privacy**: All processing happens locally in your browser
- **No API Keys**: No need for API keys or usage limits
- **Free**: No ongoing costs for API calls
- **Offline Capable**: Once the model is downloaded, it can work offline

### Model Details

- Model: `gemma-2-2b-it-q4f16_1-MLC`
- Size: ~1.2GB (downloaded once and cached)
- Capabilities: Instruction-tuned for better task understanding
- Format: 4-bit quantized for browser efficiency

## Usage

1. Click "Download Template" to get the article template
2. Fill in your articles in the template
3. Click "Load File" to upload your filled template
4. Click "Summarize Articles" to process all articles
5. Export the results using "Export XLSX" or "Export CSV"

## Limitations

- **Browser-Based Processing**: 
  - Models are downloaded and stored in the browser
  - Not ideal for users with limited bandwidth or storage
  - Processing speed depends on client hardware
  - Browser storage limits may affect model caching

- **Model Size**: 
  - Initial model download is ~1.2GB
  - Requires stable internet connection for first use

## Planned Upgrades

### Short Term
- [ ] Support for multiple models
  - Allow switching between different models
  - Compare summaries from different models
  - Model performance metrics

- [ ] Enhanced Data Validation
  - Column data type validation
  - Required field checks
  - Custom validation rules

- [ ] Flexible File Uploads
  - Support more file formats
  - Less rigid column requirements
  - Custom column mapping

### Long Term
- [ ] Backend Integration
  - User authentication
  - Database storage
  - API endpoints for programmatic access

- [ ] Advanced Features
  - Concurrent summarization
  - Custom summary instructions
  - Model cache management
  - Progress persistence
  - Batch processing controls

### Infrastructure
- [ ] Server-Side Processing Option
  - Offload processing from client
  - Support for larger models
  - Better handling of large datasets

- [ ] Progressive Web App
  - Offline support
  - Background processing
  - Push notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
