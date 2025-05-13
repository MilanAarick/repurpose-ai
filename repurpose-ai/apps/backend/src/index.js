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
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("./supabaseClient");
const gemini_1 = __importDefault(require("./routes/gemini"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// --- Supabase JWT validation middleware ---
function requireSupabaseUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            res.status(401).send('Missing Authorization header');
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).send('Missing token');
            return;
        }
        // Validate the JWT with Supabase
        const { data, error } = yield supabaseClient_1.supabase.auth.getUser(token);
        if (error || !(data === null || data === void 0 ? void 0 : data.user)) {
            res.status(401).send('Invalid or expired token');
            return;
        }
        req.supabaseUser = data.user;
        next();
    });
}
// --- USER CRUD (user_social_accounts table) ---
app.get('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseClient_1.supabase.from('user_social_accounts').select('*');
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
}));
app.post('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseClient_1.supabase.from('user_social_accounts').insert([req.body]).select();
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(201).json(data === null || data === void 0 ? void 0 : data[0]);
}));
app.get('/api/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseClient_1.supabase.from('user_social_accounts').select('*').eq('id', req.params.id).single();
    if (error) {
        res.status(404).json({ error: error.message });
        return;
    }
    res.json(data);
}));
app.put('/api/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabaseClient_1.supabase.from('user_social_accounts').update(req.body).eq('id', req.params.id).select();
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data === null || data === void 0 ? void 0 : data[0]);
}));
app.delete('/api/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield supabaseClient_1.supabase.from('user_social_accounts').delete().eq('id', req.params.id);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(204).send();
}));
// --- PROJECT CRUD (projects table, user-scoped) ---
app.get('/api/projects', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    const { data, error } = yield supabaseClient_1.supabase.from('projects').select('*').eq('user_id', userId);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
}));
app.post('/api/projects', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    const { name } = req.body;
    const { data, error } = yield supabaseClient_1.supabase.from('projects').insert([{ name, user_id: userId }]).select();
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(201).json(data === null || data === void 0 ? void 0 : data[0]);
}));
app.get('/api/projects/:id', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    const { data, error } = yield supabaseClient_1.supabase.from('projects').select('*').eq('id', req.params.id).eq('user_id', userId).single();
    if (error) {
        res.status(404).json({ error: error.message });
        return;
    }
    res.json(data);
}));
app.put('/api/projects/:id', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    const { data, error } = yield supabaseClient_1.supabase.from('projects').update(req.body).eq('id', req.params.id).eq('user_id', userId).select();
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data === null || data === void 0 ? void 0 : data[0]);
}));
app.delete('/api/projects/:id', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    // Delete all assets for this project and user
    yield supabaseClient_1.supabase.from('assets').delete().eq('project_id', req.params.id).eq('user_id', userId);
    // Delete the project
    const { error } = yield supabaseClient_1.supabase.from('projects').delete().eq('id', req.params.id).eq('user_id', userId);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(204).send();
}));
// --- ASSET CRUD (assets table, user-scoped) ---
app.get('/api/projects/:projectId/assets', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    const { data, error } = yield supabaseClient_1.supabase.from('assets').select('*').eq('project_id', req.params.projectId).eq('user_id', userId);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
}));
app.post('/api/projects/:projectId/assets', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    const { name, file_url, type, status } = req.body;
    const { data, error } = yield supabaseClient_1.supabase.from('assets').insert([{ name, file_url, type, status, project_id: req.params.projectId, user_id: userId }]).select();
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(201).json(data === null || data === void 0 ? void 0 : data[0]);
}));
app.delete('/api/assets/:id', requireSupabaseUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.supabaseUser.id;
    // Only delete if asset belongs to user
    const { data: asset, error: findError } = yield supabaseClient_1.supabase.from('assets').select('*').eq('id', req.params.id).eq('user_id', userId).single();
    if (findError || !asset) {
        res.status(404).json({ error: 'Asset not found or not authorized' });
        return;
    }
    const { error } = yield supabaseClient_1.supabase.from('assets').delete().eq('id', req.params.id).eq('user_id', userId);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(204).send();
}));
app.get('/api/protected', requireSupabaseUser, (req, res) => {
    res.send('This is a protected route for user: ' + req.supabaseUser.email);
});
app.use('/api', gemini_1.default);
app.get('/', (req, res) => { res.send('API running!'); });
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
