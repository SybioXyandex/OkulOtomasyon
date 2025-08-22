/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { createClient, PostgrestError } from "@supabase/supabase-js";


// --- API KEYS ---
// DİKKAT: Bu API anahtarını doğrudan koda eklemek güvenlik riski oluşturabilir.
// Üretim ortamında bu anahtarı bir ortam değişkeni (environment variable) olarak ayarlamanız önerilir.


// --- SUPABASE SETUP ---
const SUPABASE_URL = 'https://peettiigrkhtloqschwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZXR0aWlncmtodGxvcXNjaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzMsImV4cCI6MjA3MTIwMzczM30.mnnIlRJaRQP2RnHyb-0Sp0AwPE6hTUe5uWrMi-Q6pnc';


// --- DATABASE TYPES (auto-generated or manually typed) ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          status: "pending_teacher" | "approved"
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          status: "pending_teacher" | "approved"
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: "pending_teacher" | "approved"
        }
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          status: "pending_admin" | "published"
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          status: "pending_admin" | "published"
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          status?: "pending_admin" | "published"
          title?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: "student" | "parent" | "teacher" | "admin"
          username: string
        }
        Insert: {
          id: string
          role: "student" | "parent" | "teacher" | "admin"
          username: string
        }
        Update: {
          id?: string
          role?: "student" | "parent" | "teacher" | "admin"
          username?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      comment_status: "pending_teacher" | "approved"
      post_status: "pending_admin" | "published"
      user_role: "student" | "parent" | "teacher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

const db = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- TYPES ---
type Role = Database['public']['Enums']['user_role'];
type PostStatus = Database['public']['Enums']['post_status'];
type CommentStatus = Database['public']['Enums']['comment_status'];


interface User {
    id: string; // from supabase.auth.user
    username: string;
    role: Role;
}

interface Post {
    id: string;
    authorId: string;
    authorName: string;
    title: string;
    content: string;
    createdAt: string;
    status: PostStatus;
}

interface PostComment {
    id:string;
    postId: string;
    authorId: string;
    authorName: string;
    authorRole: Role;
    content: string;
    createdAt: string;
    status: CommentStatus;
    parentId?: string | null;
}

interface AppState {
    currentUser: User | null;
    posts: Post[];
    comments: PostComment[];
    authView: 'login' | 'register';
    error: string | null;
    loading: boolean;
}

// --- STATE MANAGEMENT ---
function getInitialState(): AppState {
    return {
        currentUser: null,
        posts: [],
        comments: [],
        authView: 'login',
        error: null,
        loading: true,
    };
}

let state: AppState = getInitialState();

function setState(newState: Partial<AppState>) {
    state = { ...state, ...newState };
    renderApp();
}

// --- UTILITIES ---
const $ = (selector: string) => document.querySelector(selector);
const $$ = (selector: string) => document.querySelectorAll(selector);

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function linkify(plainText: string): string {
    if (!plainText) return '';

    // First, escape any special HTML characters to prevent XSS.
    const escapedText = plainText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // Regex to find URLs.
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    
    return escapedText.replace(urlRegex, (url) => {
        let href = url;
        // Prepend 'http://' if the URL starts with 'www.' but has no protocol.
        if (url.toLowerCase().startsWith('www.')) {
            href = 'http://' + href;
        }
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

// --- RENDER FUNCTIONS ---

function renderApp() {
    const root = document.getElementById('root');
    if (!root) return;

    if (state.loading) {
        root.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;
        return;
    }

    if (state.currentUser) {
        root.innerHTML = renderDashboard();
    } else {
        root.innerHTML = renderAuth();
    }
    attachEventListeners();
}

function renderAuth(): string {
    const isLogin = state.authView === 'login';
    return `
        <div class="auth-container">
            <div class="auth-tabs">
                <button class="auth-tab ${isLogin ? 'active' : ''}" data-view="login">Giriş Yap</button>
                <button class="auth-tab ${!isLogin ? 'active' : ''}" data-view="register">Kayıt Ol</button>
            </div>
            <form id="${isLogin ? 'login-form' : 'register-form'}">
                <div class="form-group">
                    <label for="email">E-posta</label>
                    <input type="email" id="email" class="form-control" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="password">Şifre</label>
                    <input type="password" id="password" class="form-control" required autocomplete="current-password">
                </div>
                ${!isLogin ? `
                    <div class="form-group">
                        <label for="role">Rol</label>
                        <select id="role" class="form-control" required>
                            <option value="student">Öğrenci</option>
                            <option value="parent">Veli</option>
                        </select>
                    </div>
                ` : ''}
                <button type="submit" class="btn btn-primary btn-block">
                    ${isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                </button>
                ${state.error ? `<p class="error-message">${state.error}</p>` : ''}
            </form>
        </div>
    `;
}

function renderDashboard(): string {
    const user = state.currentUser!;
    return `
        <header class="dashboard-header">
            <h1>Okul İletişim Platformu</h1>
            <div class="user-info">
                <span>Hoşgeldin, <strong>${user.username}</strong> (${user.role})</span>
                <button id="logout-btn" class="btn">Çıkış Yap</button>
            </div>
        </header>
        <main>
            ${user.role === 'teacher' || user.role === 'admin' ? renderPostCreationForm() : ''}
            <div class="feed-container">
                ${getVisiblePosts().map(renderPost).join('')}
            </div>
        </main>
    `;
}

function renderPostCreationForm(): string {
    return `
        <div class="post-creation-card">
            <h2>Yeni Duyuru/Etkinlik Oluştur</h2>
            <form id="create-post-form">
                <div class="form-group">
                    <label for="post-title">Başlık</label>
                    <input type="text" id="post-title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="post-content">İçerik</label>
                    <textarea id="post-content" class="form-control" required></textarea>
                </div>
                <div class="post-creation-form-actions">
                    <button type="button" class="btn btn-outline" id="open-ai-modal-btn">✨ AI ile Oluştur</button>
                    <button type="submit" class="btn btn-primary">Gönder</button>
                </div>
            </form>
        </div>
    `;
}

function getVisiblePosts(): Post[] {
    const user = state.currentUser!;
    if (user.role === 'admin' || user.role === 'teacher') {
        return state.posts;
    }
    return state.posts.filter(p => p.status === 'published');
}

function renderPost(post: Post): string {
    const user = state.currentUser!;
    const isAdmin = user.role === 'admin';
    const canSeeComments = user.role !== 'student';

    let statusBadge = '';
    if (post.status === 'pending_admin') {
        statusBadge = `<span class="badge badge-warning">Yönetici Onayı Bekliyor</span>`;
    }

    const commentCount = canSeeComments ? getVisibleComments(post.id).length : 0;

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-header-info">
                    <h2>${post.title}</h2>
                    <p class="post-meta">
                        ${post.authorName} tarafından, ${formatDate(post.createdAt)}
                    </p>
                </div>
                <div class="post-header-actions">
                    ${statusBadge}
                    ${isAdmin && post.status === 'pending_admin' ? `
                        <button class="btn btn-success btn-sm" data-action="publish-post" data-post-id="${post.id}">Yayınla</button>
                    ` : ''}
                </div>
            </div>
            <div class="post-content">${linkify(post.content)}</div>
            ${canSeeComments ? `
                <div class="post-actions">
                    <button class="btn-toggle-comments" data-action="toggle-comments" data-post-id="${post.id}">
                        Yorumları Göster (${commentCount})
                    </button>
                </div>
                <div class="comments-container hidden" id="comments-for-${post.id}">
                    ${renderCommentsSection(post.id)}
                </div>
            ` : ''}
        </div>
    `;
}

function getVisibleComments(postId: string): PostComment[] {
    const user = state.currentUser!;
    const postComments = state.comments.filter(c => c.postId === postId);

    if (user.role === 'admin' || user.role === 'teacher') {
        return postComments;
    }
    return postComments.filter(c => c.status === 'approved' || (c.authorId === user.id));
}


function renderCommentsSection(postId: string): string {
    const user = state.currentUser!;
    const comments = getVisibleComments(postId);

    const repliesByParentId = comments.reduce((acc, comment) => {
        if (comment.parentId) {
            if (!acc[comment.parentId]) {
                acc[comment.parentId] = [];
            }
            acc[comment.parentId].push(comment);
        }
        return acc;
    }, {} as Record<string, PostComment[]>);

    const topLevelComments = comments.filter(c => !c.parentId);
    const canComment = ['parent', 'teacher', 'admin'].includes(user.role);

    return `
        <div class="comments-section">
            <h3>Yorumlar</h3>
            <div class="comments-list">
                ${topLevelComments.length > 0
                    ? topLevelComments.map(comment => `
                        <div class="comment-thread">
                            ${renderComment(comment)}
                            <div class="replies-container">
                                ${(repliesByParentId[comment.id] || []).map(reply => renderComment(reply, true)).join('')}
                            </div>
                        </div>
                    `).join('')
                    : '<p>Henüz yorum yapılmamış.</p>'}
            </div>
            ${canComment ? `
                <form class="comment-form" data-action="add-comment" data-post-id="${postId}">
                    <div class="form-group">
                       <textarea class="form-control" name="comment-content" placeholder="Yorumunuzu yazın..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm">Gönder</button>
                </form>
            ` : ''}
        </div>
    `;
}

function renderComment(comment: PostComment, isReply: boolean = false): string {
    const user = state.currentUser!;
    const isTeacherOrAdmin = user.role === 'teacher' || user.role === 'admin';
    const canReply = ['parent', 'teacher', 'admin'].includes(user.role);

    let statusBadge = '';
    if (comment.status === 'pending_teacher') {
        statusBadge = `<span class="badge badge-secondary">Onay Bekliyor</span>`;
    }

    return `
        <div class="comment ${isReply ? 'is-reply' : ''} comment-role-${comment.authorRole}" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${comment.authorName} (${comment.authorRole})</span>
                <div class="comment-actions">
                    ${statusBadge}
                    ${isTeacherOrAdmin && comment.status === 'pending_teacher' ? `
                        <button class="btn btn-success btn-sm" data-action="approve-comment" data-comment-id="${comment.id}">Onayla</button>
                    ` : ''}
                </div>
            </div>
            <p class="comment-body">${comment.content}</p>
            <div class="comment-footer">
                ${canReply ? `
                    <button class="btn-reply" data-action="toggle-reply-form" data-comment-id="${comment.id}">Yanıtla</button>
                ` : ''}
            </div>
            <form class="comment-form reply-form hidden" data-action="add-reply" data-post-id="${comment.postId}" data-parent-id="${comment.id}">
                <div class="form-group">
                    <textarea class="form-control" name="reply-content" placeholder="Yanıtınızı yazın..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Gönder</button>
            </form>
        </div>
    `;
}

// --- EVENT HANDLERS & LOGIC ---

function attachEventListeners() {
    // Auth
    $$('.auth-tab').forEach(tab => tab.addEventListener('click', handleAuthTabClick));
    $('#login-form')?.addEventListener('submit', handleLogin);
    $('#register-form')?.addEventListener('submit', handleRegister);

    // Dashboard
    $('#logout-btn')?.addEventListener('click', handleLogout);
    $('#create-post-form')?.addEventListener('submit', handleCreatePost);
    $('#open-ai-modal-btn')?.addEventListener('click', handleOpenAIModal);
    
    // Post & Comment Actions
    $$('[data-action="publish-post"]').forEach(btn => btn.addEventListener('click', handlePublishPost));
    $$('[data-action="approve-comment"]').forEach(btn => btn.addEventListener('click', handleApproveComment));
    $$('[data-action="add-comment"]').forEach(form => form.addEventListener('submit', handleAddComment));
    $$('[data-action="toggle-reply-form"]').forEach(btn => btn.addEventListener('click', handleToggleReplyForm));
    $$('[data-action="add-reply"]').forEach(form => form.addEventListener('submit', handleAddReply));
    $$('[data-action="toggle-comments"]').forEach(btn => btn.addEventListener('click', handleToggleComments));
}

function handleAuthTabClick(e: Event) {
    const target = e.currentTarget as HTMLButtonElement;
    const view = target.dataset.view as 'login' | 'register';
    setState({ authView: view, error: null });
}

async function handleLogin(e: Event) {
    e.preventDefault();
    const emailInput = $('#email') as HTMLInputElement;
    const passwordInput = $('#password') as HTMLInputElement;

    if (!emailInput || !passwordInput) {
        setState({ error: 'Giriş formu hatası. Lütfen tekrar deneyin.', loading: false });
        return;
    }
    const email = emailInput.value;
    const password = passwordInput.value;
    
    setState({ loading: true, error: null });

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
        setState({ error: 'Giriş bilgileri hatalı.', loading: false });
    }
    // onAuthStateChange handles success
}

async function handleRegister(e: Event) {
    e.preventDefault();
    const emailInput = $('#email') as HTMLInputElement;
    const passwordInput = $('#password') as HTMLInputElement;
    const roleInput = $('#role') as HTMLSelectElement;

    if (!emailInput || !passwordInput || !roleInput) {
        setState({ error: 'Kayıt formu hatası. Lütfen tekrar deneyin.', loading: false });
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;
    const role = roleInput.value as Role;
    const username = email.split('@')[0];

    setState({ loading: true, error: null });

    const { error } = await db.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
                role: role
            }
        }
    });

    if (error) {
        let userMessage = error.message;
        // Provide a more user-friendly error for a common Supabase backend misconfiguration.
        if (userMessage.includes('Database error saving new user')) {
            userMessage = 'Kayıt sırasında bir sunucu hatası oluştu. Lütfen sistem yöneticisi ile iletişime geçin.';
        }
        setState({ error: userMessage, loading: false });
    }
    // onAuthStateChange will handle login and data load automatically on success.
}


async function handleLogout() {
    setState({ loading: true });
    await db.auth.signOut();
    // onAuthStateChange will handle the UI update to the login screen
}

async function handleAction(action: () => PromiseLike<{ error: PostgrestError | null }>) {
    setState({ loading: true });
    const { error } = await action();
    if (error) {
        console.error("Supabase error:", error);
        setState({ error: "Bir hata oluştu: " + error.message, loading: false });
    } else {
        await loadAppData(); // Re-fetch all data after any action
    }
}

function handleCreatePost(e: Event) {
    e.preventDefault();
    const title = ($('#post-title') as HTMLInputElement).value;
    const content = ($('#post-content') as HTMLTextAreaElement).value;
    const user = state.currentUser!;

    const newPost: Database['public']['Tables']['posts']['Insert'] = {
        author_id: user.id,
        title,
        content,
        status: (user.role === 'admin' ? 'published' : 'pending_admin')
    };
    
    handleAction(() => db.from('posts').insert(newPost));
}

function handlePublishPost(e: Event) {
    const postId = (e.currentTarget as HTMLElement).dataset.postId!;
    const payload: Database['public']['Tables']['posts']['Update'] = { status: 'published' };
    handleAction(() => db.from('posts').update(payload).eq('id', postId));
}

function handleApproveComment(e: Event) {
    const commentId = (e.currentTarget as HTMLElement).dataset.commentId!;
    const payload: Database['public']['Tables']['comments']['Update'] = { status: 'approved' };
    handleAction(() => db.from('comments').update(payload).eq('id', commentId));
}

function handleAddComment(e: Event) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const postId = form.dataset.postId!;
    const contentEl = form.querySelector('[name="comment-content"]') as HTMLTextAreaElement;
    const content = contentEl.value;
    const user = state.currentUser!;

    if(!content.trim()) return;

    const newComment: Database['public']['Tables']['comments']['Insert'] = {
        post_id: postId,
        author_id: user.id,
        content,
        status: (user.role === 'parent' ? 'pending_teacher' : 'approved')
    };
    
    handleAction(() => db.from('comments').insert(newComment));
}

function handleToggleReplyForm(e: Event) {
    const commentId = (e.currentTarget as HTMLElement).dataset.commentId!;
    const commentElement = (e.currentTarget as HTMLElement).closest('.comment');
    const replyForm = commentElement?.querySelector('.reply-form');
    replyForm?.classList.toggle('hidden');
    if (!replyForm?.classList.contains('hidden')) {
        (replyForm?.querySelector('textarea') as HTMLTextAreaElement).focus();
    }
}

function handleAddReply(e: Event) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const postId = form.dataset.postId!;
    const parentId = form.dataset.parentId!;
    const contentEl = form.querySelector('[name="reply-content"]') as HTMLTextAreaElement;
    const content = contentEl.value;
    const user = state.currentUser!;

    if (!content.trim()) return;

    const newReply: Database['public']['Tables']['comments']['Insert'] = {
        post_id: postId,
        parent_id: parentId,
        author_id: user.id,
        content,
        status: (user.role === 'parent' ? 'pending_teacher' : 'approved')
    };

    handleAction(() => db.from('comments').insert(newReply));
}

function handleToggleComments(e: Event) {
    const button = e.currentTarget as HTMLButtonElement;
    const postId = button.dataset.postId!;
    const commentsContainer = $(`#comments-for-${postId}`);
    
    if (commentsContainer) {
        const isHidden = commentsContainer.classList.toggle('hidden');
        const commentCount = getVisibleComments(postId).length;
        if (isHidden) {
            button.textContent = `Yorumları Göster (${commentCount})`;
        } else {
            button.textContent = `Yorumları Gizle (${commentCount})`;
        }
    }
}

// --- AI ASSISTANT ---

function createAIModalHTML(): string {
    return `
        <div class="modal-overlay" id="ai-modal-overlay">
            <div class="modal-content" id="ai-modal-content" role="dialog" aria-labelledby="ai-modal-title" aria-modal="true">
                <div class="modal-header">
                    <h2 id="ai-modal-title">✨ AI Duyuru Asistanı</h2>
                    <button class="modal-close-btn" aria-label="Kapat">&times;</button>
                </div>
                <form id="generate-ai-form">
                    <div class="form-group">
                        <label for="ai-brief">Duyurunun ana fikri</label>
                        <input type="text" id="ai-brief" class="form-control" placeholder="Örn: Cuma günü 5. sınıflar için matematik sınavı" required>
                    </div>
                    <div class="form-group">
                        <label for="ai-tone">Metin tonu</label>
                        <select id="ai-tone" class="form-control" required>
                            <option value="Resmi">Resmi</option>
                            <option value="Samimi">Samimi</option>
                            <option value="Acil">Acil</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Oluştur</button>
                </form>
                <div id="ai-result-container">
                    <p>Duyuru metni burada görünecek.</p>
                </div>
            </div>
        </div>
    `;
}

function handleOpenAIModal() {
    const modal = createAIModalHTML();
    document.body.insertAdjacentHTML('beforeend', modal);
    
    $('#ai-modal-overlay')?.addEventListener('click', handleCloseAIModal);
    $('#ai-modal-content')?.addEventListener('click', (e) => e.stopPropagation());
    $('.modal-close-btn')?.addEventListener('click', handleCloseAIModal);
    $('#generate-ai-form')?.addEventListener('submit', handleGenerateAnnouncement);
}

function handleCloseAIModal() {
    const modal = $('#ai-modal-overlay');
    modal?.remove();
}

async function handleGenerateAnnouncement(e: Event) {
    e.preventDefault();
    const brief = ($('#ai-brief') as HTMLInputElement).value;
    const tone = ($('#ai-tone') as HTMLSelectElement).value;
    const resultContainer = $('#ai-result-container');
    const generateBtn = ($('#generate-ai-form button[type="submit"]') as HTMLButtonElement);

    if (!brief || !resultContainer || !generateBtn) return;
    
    resultContainer.innerHTML = `<div class="loader"></div>`;
    generateBtn.disabled = true;
    generateBtn.textContent = 'Oluşturuluyor...';

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Lütfen aşağıdaki notlara ve tona göre, bir okul duyuru platformu için veli ve öğrencilere yönelik bir duyuru metni oluştur. Duyuru net, anlaşılır ve profesyonel olsun.\n\nNotlar: "${brief}"\n\nTon: ${tone}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are an AI assistant for a school communication platform. Your task is to write announcements in Turkish for students and parents. Ensure the tone is appropriate and the message is clear and professional, based on the user's notes.",
            }
        });
        
        const generatedText = response.text;

        resultContainer.innerHTML = `
            <div class="form-group" style="width: 100%;">
                <label>Oluşturulan Metin</label>
                <textarea id="ai-generated-text" class="form-control" rows="8">${generatedText}</textarea>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="use-ai-text-btn">Bu Metni Kullan</button>
            </div>
        `;

        $('#use-ai-text-btn')?.addEventListener('click', () => {
            const postContent = $('#post-content') as HTMLTextAreaElement;
            const aiText = $('#ai-generated-text') as HTMLTextAreaElement;
            if (postContent && aiText) {
                postContent.value = aiText.value;
                postContent.dispatchEvent(new Event('input', { bubbles: true })); // For any autosize listeners
                postContent.focus();
            }
            handleCloseAIModal();
        });

    } catch (error) {
        console.error("Gemini API error:", error);
        resultContainer.innerHTML = `<p class="error-message">AI metin oluştururken bir hata oluştu. Lütfen API anahtarınızın doğru olduğundan emin olun ve tekrar deneyin.</p>`;
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Oluştur';
    }
}

// --- DATA FETCHING & INITIALIZATION ---

async function loadAppData() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.user) {
        setState({ loading: false, currentUser: null, authView: 'login' });
        return;
    }

    const user = session.user;

    // Robust Profile Fetching with Retry
    let profile = null;
    let profileError: any = null;
    for (let i = 0; i < 3; i++) {
        const { data, error } = await db.from('profiles').select('username, role').eq('id', user.id).single();
        if (data && !error) {
            profile = data;
            profileError = null;
            break;
        }
        profileError = error;
        // Wait 500ms before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (profileError || !profile) {
        const detail = profileError ? `${profileError.message} (Kod: ${profileError.code})` : 'Profil verisi bulunamadı.';
        console.error("Profile fetch error after retries:", profileError);
        
        // If profile is not found, it's a critical error. Log the user out.
        await db.auth.signOut();
        setState({
            loading: false,
            error: `Oturum açılamadı: Kullanıcı profili alınamadı. Lütfen veritabanı kurulumunun doğru olduğundan emin olun. Detay: ${detail}`,
            currentUser: null,
            authView: 'login'
        });
        return;
    }

    const [postsResult, commentsResult] = await Promise.all([
        db.from('posts').select('*, profiles(username)').order('created_at', { ascending: false }),
        db.from('comments').select('*, profiles(username, role)').order('created_at', { ascending: true })
    ]);

    if (postsResult.error) {
        const errorMessage = `Duyurular alınamadı: ${postsResult.error.message}`;
        console.error("Posts fetch error:", postsResult.error);
        setState({ loading: false, error: errorMessage });
        return;
    }

    if (commentsResult.error) {
        const errorMessage = `Yorumlar alınamadı: ${commentsResult.error.message}`;
        console.error("Comments fetch error:", commentsResult.error);
        setState({ loading: false, error: errorMessage });
        return;
    }

    const currentUser: User = { id: user.id, username: profile.username, role: profile.role as Role };
    const posts: Post[] = postsResult.data.map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        authorName: p.profiles?.username || 'Bilinmeyen Yazar',
        title: p.title,
        content: p.content,
        createdAt: p.created_at,
        status: p.status,
    }));
    const comments: PostComment[] = commentsResult.data.map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorName: c.profiles?.username || 'Bilinmeyen Kullanıcı',
        authorRole: c.profiles?.role || 'student',
        content: c.content,
        createdAt: c.created_at,
        status: c.status,
        parentId: c.parent_id,
    }));

    setState({ currentUser, posts, comments, loading: false, error: null });
}


document.addEventListener('DOMContentLoaded', () => {
    // Initial check
    loadAppData();
    
    // Listen for auth changes
    db.auth.onAuthStateChange((event: string, session: any) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            loadAppData();
        } else if (event === 'SIGNED_OUT') {
            setState(getInitialState()); // Reset to initial state and show login
            state.loading = false;
            renderApp();
        }
    });
});
