"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../supabaseClient");
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
// Get all active Gemini API keys, ordered by usage_count
router.get('/gemini-keys', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseClient_1.supabase
        .from('gemini_api_keys')
        .select('*')
        .eq('active', true)
        .order('usage_count', { ascending: true });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Summarize transcript and save to asset
router.post('/summarize', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { assetId, transcript } = req.body;
    if (!assetId || !transcript) {
        return res.status(400).json({ error: 'assetId and transcript are required' });
    }
    // 1. Get the least-used active Gemini API key
    const { data: keys, error: keyError } = yield supabaseClient_1.supabase
        .from('gemini_api_keys')
        .select('*')
        .eq('active', true)
        .order('usage_count', { ascending: true })
        .limit(1);
    if (keyError || !keys || keys.length === 0) {
        return res.status(500).json({ error: 'No active Gemini API keys available' });
    }
    const apiKey = keys[0].api_key;
    // 2. Call Gemini API
    try {
        const geminiRes = yield axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: `Summarize this transcript:\n${transcript}` }] }]
        });
        const summary = ((_e = (_d = (_c = (_b = (_a = geminiRes.data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || '';
        // 3. Save summary to asset
        const { error: updateError } = yield supabaseClient_1.supabase
            .from('assets')
            .update({ summary })
            .eq('id', assetId);
        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }
        // 4. Increment usage_count for the key
        yield supabaseClient_1.supabase
            .from('gemini_api_keys')
            .update({ usage_count: keys[0].usage_count + 1, last_used_at: new Date().toISOString() })
            .eq('id', keys[0].id);
        res.json({ summary });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Gemini API error' });
    }
}));
exports.default = router;
