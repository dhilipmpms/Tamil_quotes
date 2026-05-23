import { createClient } from '@supabase/supabase-js';

// Check if environment variables are set and not placeholders
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

let supabase;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Mock Database implementation for LocalStorage fallback
  console.warn('Supabase URL/Key missing or default. Falling back to Local Mock Database.');

  // Pre-seed helper functions
  const SEED_CATEGORIES = [
    { id: 'c1', name: 'Motivation', slug: 'motivation', description: 'Inspirational thoughts to fuel your daily drive.', type: 'quotes' },
    { id: 'c2', name: 'Life', slug: 'life', description: 'Wisdom and reflections on the journey of life.', type: 'quotes' },
    { id: 'c3', name: 'Love', slug: 'love', description: 'Romance, affection, and emotional bonding.', type: 'quotes' },
    { id: 'c4', name: 'Friendship', slug: 'friendship', description: 'Honoring companions and loyal friendships.', type: 'quotes' },
    { id: 'c5', name: 'Success', slug: 'success', description: 'Principles for achieving goals and excellence.', type: 'quotes' },
    { id: 'c6', name: 'Wisdom', slug: 'wisdom', description: 'Deep insights from ancient and modern thinkers.', type: 'quotes' },
    { id: 'c7', name: 'Spirituality', slug: 'spirituality', description: 'Exploring inner peace and spiritual consciousness.', type: 'quotes' },
    { id: 'c8', name: 'Classical Tamil Poetry', slug: 'classical-poetry', description: 'Poetry in traditional forms (Sangam literature style).', type: 'kavithai' },
    { id: 'c9', name: 'Modern Kavithai', slug: 'modern-poetry', description: 'Contemporary free-verse (Puthukkavithai) expressing modern emotions.', type: 'kavithai' },
    { id: 'c10', name: 'Stoicism', slug: 'stoicism', description: 'Practical philosophy focusing on resilience and virtue.', type: 'philosophy' },
    { id: 'c11', name: 'Tamil Wisdom & Thirukkural', slug: 'tamil-wisdom', description: 'Exploring teachings of Thiruvalluvar, Avvaiyar, and others.', type: 'philosophy' },
    { id: 'c12', name: 'Ethics & Personal Growth', slug: 'ethics', description: 'Moral guidance and self-improvement frameworks.', type: 'philosophy' },
    { id: 'c13', name: 'Inspirational Stories', slug: 'inspirational-stories', description: 'Tales of resilience, kindness, and personal triumphs.', type: 'stories' },
    { id: 'c14', name: 'Life Experiences', slug: 'life-experiences', description: 'Reflective short stories about everyday epiphanies.', type: 'stories' }
  ];

  const SEED_TAGS = [
    { id: 't1', name: 'Thiruvalluvar', slug: 'thiruvalluvar' },
    { id: 't2', name: 'Bharathiyar', slug: 'bharathiyar' },
    { id: 't3', name: 'Avvaiyar', slug: 'avvaiyar' },
    { id: 't4', name: 'Marcus Aurelius', slug: 'marcus-aurelius' },
    { id: 't5', name: 'Self-Discipline', slug: 'self-discipline' },
    { id: 't6', name: 'Hope', slug: 'hope' },
    { id: 't7', name: 'Silence', slug: 'silence' },
    { id: 't8', name: 'Peace', slug: 'peace' },
    { id: 't9', name: 'Nature', slug: 'nature' }
  ];

  const SEED_PROFILES = [
    { id: 'admin-id', username: 'TamilArasan', email: 'admin@tamilplatform.com', profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', bio: 'Tamil Scholar & Platform Administrator', role: 'admin', created_at: new Date().toISOString() },
    { id: 'user-id-1', username: 'BharathiLover', email: 'user1@gmail.com', profile_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', bio: 'Passionate about poetry and literature.', role: 'user', created_at: new Date().toISOString() }
  ];

  const SEED_QUOTES = [
    { id: 'q1', title: 'Purpose of Life', content: 'துப்பார்க்குத் துப்பாய துப்பாக்கித் துப்பார்க்குத் துப்பாய தூஉம் மழை.', author: 'Thiruvalluvar', category: 'life', tags: ['thiruvalluvar'], language: 'ta', featured: true, views: 142, status: 'approved', created_at: new Date().toISOString() },
    { id: 'q2', title: 'Fearlessness', content: 'அச்சமில்லை அச்சமில்லை அச்சமென்ப தில்லையே...', author: 'Mahakavi Bharathiyar', category: 'motivation', tags: ['bharathiyar', 'hope'], language: 'ta', featured: false, views: 98, status: 'approved', created_at: new Date().toISOString() },
    { id: 'q3', title: 'Wisdom of Age', content: 'அறம் செய விரும்பு. ஆறுவது சினம். இயல்வது கரவேல்.', author: 'Avvaiyar', category: 'wisdom', tags: ['avvaiyar'], language: 'ta', featured: false, views: 76, status: 'approved', created_at: new Date().toISOString() },
    { id: 'q4', title: 'Control Your Mind', content: 'You have power over your mind - not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius', category: 'wisdom', tags: ['marcus-aurelius', 'self-discipline'], language: 'en', featured: true, views: 231, status: 'approved', created_at: new Date().toISOString() },
    { id: 'q5', title: 'True Friendship', content: 'நவில்தொறும் நூல்நயம் போலும் பயில்தொறும் பண்புடை யாளர் தொடர்பு.', author: 'Thiruvalluvar', category: 'friendship', tags: ['thiruvalluvar'], language: 'ta', featured: false, views: 54, status: 'approved', created_at: new Date().toISOString() }
  ];

  const SEED_KAVITHAI = [
    { id: 'k1', title: 'காற்று', content: `விசையுறு பந்தினைப்போல் - உள்ளம்
வேண்டியவாறு செல்லுமடா!
விண்ணையும் மண்ணையும் கைகளில் ஏந்தி
விளையாட நினைக்குமடா!
காற்றே, என் ஜீவனின் கீதமே,
நின் வேகம் தடையறியாதது!`, author: 'பாரதியார்', category: 'modern-poetry', tags: ['bharathiyar', 'nature'], language: 'ta', featured: true, views: 320, status: 'approved', created_at: new Date().toISOString() },
    { id: 'k2', title: 'மௌனத்தின் மொழி', content: `சொற்கள் களைந்து போன மாலையில்
உன் மௌனம் மட்டும்
என் அறையெங்கும் நிரம்பி வழிகிறது...
பேசப்படாத வார்த்தைகளே
கவிதையாகிப் போகின்றன.`, author: 'கவி நிலவன்', category: 'modern-poetry', tags: ['silence', 'peace'], language: 'ta', featured: false, views: 104, status: 'approved', created_at: new Date().toISOString() }
  ];

  const SEED_ARTICLES = [
    { id: 'a1', title: 'Thirukkural: The Global Code of Ethics', content: `# Thirukkural: The Global Code of Ethics

Thirukkural, written by the sage Thiruvalluvar over 2,000 years ago, remains one of the most comprehensive secular ethical guides in human history. 

Unlike many contemporary texts, Thirukkural does not advocate for any specific religion, sect, or community. It focuses purely on **Aram (Virtue)**, **Porul (Wealth/Statecraft)**, and **Inbam (Love/Family Life)**.

## The Core Concept of Aram (Virtue)
Aram is defined as acting with a pure mind. Valluvar states:
> "மனத்துக்கண் மாசிலன் ஆதல் அனைத்துஅறன்; ஆகுல நீர பிற."
*(To be pure in mind is all virtue; all else is mere empty sound.)*

This standard forms the bedrock of personal growth and ethical living. It encourages:
1. **Gratitude (செய்ந்நன்றி அறிதல்)**: Recognizing kindness and never forgetting a good deed.
2. **Speech (இனியவை கூறல்)**: Speaking pleasant, gentle words instead of harsh, destructive ones.
3. **Equanimity (நடுவுநிலைமை)**: Being fair and impartial to friends, strangers, and enemies alike.

In a globalized world filled with conflicts, Valluvar's timeless insights offer a blueprint for harmony and personal peace.`, author: 'Dr. S. Raman', category: 'tamil-wisdom', tags: ['thiruvalluvar'], language: 'en', featured: true, views: 412, reading_time: 6, status: 'approved', created_at: new Date().toISOString() },
    { id: 'a2', title: 'Stoicism and Tamil Sangam Wisdom: An Unexpected Parallel', content: `# Stoicism and Tamil Sangam Wisdom: An Unexpected Parallel

Is there a connection between the philosophy of Ancient Rome/Greece and the Classical Tamil Sangam era? While separated by thousands of miles, Stoics and Tamil poets shared striking philosophical foundations.

## Universal Citizenship (Cosmopolitanism)
Seneca and Marcus Aurelius famously spoke of being citizens of the world. In the Tamil tradition, this was beautifully summarized by the poet **Kaniyan Pungundranar** in Purananuru:
> "யாதும் ஊரே யாவரும் கேளிர்"
*(Every town is my hometown, and everyone is my kinsman.)*

This verse represents a peak of humanistic thought, mirroring the Stoic concept of *Oikeiosis* - the widening circle of ethical concern.

## Accepting the Flow of Nature (Amor Fati)
Stoicism teaches us to accept external events beyond our control. Similarly, Pungundranar wrote:
> "தீதும் நன்றும் பிறர்தர வாரா... 
பெரியோரை வியத்தலும் இலமே, சிறியோரை இகழ்தல் அதனினும் இலமே."
*(Good and evil do not come from others... We do not marvel at the great, and much less do we despise the small.)*

This displays a calm acceptance of life's vicissitudes, demonstrating that deep, resilient wisdom is universal to human consciousness.`, author: 'Aravind K.', category: 'stoicism', tags: ['marcus-aurelius', 'peace'], language: 'en', featured: false, views: 185, reading_time: 7, status: 'approved', created_at: new Date().toISOString() }
  ];

  const SEED_STORIES = [
    { id: 's1', title: 'The Merchant\'s Ledger of Good Deeds', content: `# The Merchant's Ledger of Good Deeds

Deep in the historical city of Madurai, during the Pandyan rule, lived a merchant named Meiyappan. Unlike other traders who counted gold coins, Meiyappan kept a separate, secret ledger bound in red silk. 

One day, his young apprentice, Somu, asked: "Master, what accounts do you write in that red book? Is it our hidden profits?"

Meiyappan smiled, his eyes reflecting the evening lamps. "No, Somu. This is my ledger of debts that can never be paid in coin. It is the kindness ledger."

He opened the book and showed a page. 
- *Item 1:* A farmer who shared his gruel when my cart broke down in the rain (Value: Lifesaving).
- *Item 2:* A stranger who warned me of thieves in the pass (Value: Beyond price).

"But master, why write these down?" Somu asked.

"Because," Meiyappan replied, "in business, we count what people owe us. In life, we must count what we owe to the goodness of others. Every time I look at this ledger, I am reminded that my success is built on the silent kindness of a thousand strangers. It keeps my heart soft and my hands open."

Somu looked at his master with newfound respect. From that day, he too began writing his own red ledger, realizing that true wealth is not stored in chests of gold, but in a grateful mind.`, author: 'K. Sundaram', category: 'inspirational-stories', tags: ['hope', 'peace'], language: 'ta', featured: true, views: 290, reading_time: 5, status: 'approved', created_at: new Date().toISOString() }
  ];

  const getMockTable = (table) => {
    const key = `mock_${table}`;
    let data = localStorage.getItem(key);
    if (!data) {
      if (table === 'categories') data = SEED_CATEGORIES;
      else if (table === 'tags') data = SEED_TAGS;
      else if (table === 'profiles') data = SEED_PROFILES;
      else if (table === 'quotes') data = SEED_QUOTES;
      else if (table === 'kavithai') data = SEED_KAVITHAI;
      else if (table === 'philosophy_articles') data = SEED_ARTICLES;
      else if (table === 'stories') data = SEED_STORIES;
      else if (table === 'submissions') data = [];
      else if (table === 'comments') data = [
        { id: 'comm1', user_id: 'user-id-1', content_type: 'quotes', content_id: 'q1', message: 'அற்புதமான வரிகள்! மழைக்கு பின்னால் இருக்கும் தத்துவம் மிக நன்று.', parent_id: null, reported: false, created_at: new Date().toISOString() },
        { id: 'comm2', user_id: 'admin-id', content_type: 'quotes', content_id: 'q1', message: 'மிகச் சரி! மழை தரும் கொடையை வள்ளுவர் அழகாக விளக்கியுள்ளார்.', parent_id: 'comm1', reported: false, created_at: new Date().toISOString() }
      ];
      else if (table === 'bookmarks') data = [];
      else if (table === 'likes') data = [];
      else data = [];
      localStorage.setItem(key, JSON.stringify(data));
      return data;
    }
    return JSON.parse(data);
  };

  const saveMockTable = (table, data) => {
    localStorage.setItem(`mock_${table}`, JSON.stringify(data));
  };

  // Mock Query Builder
  class MockQueryBuilder {
    constructor(tableName) {
      this.tableName = tableName;
      this.filters = [];
      this.orderCol = null;
      this.orderAsc = true;
      this.limitCount = null;
      this.isSingle = false;
      this.orFilterString = null;
    }

    select(fields) {
      return this;
    }

    eq(col, val) {
      this.filters.push((item) => item[col] === val);
      return this;
    }

    or(filterStr) {
      this.orFilterString = filterStr;
      return this;
    }

    order(col, { ascending = true } = {}) {
      this.orderCol = col;
      this.orderAsc = ascending;
      return this;
    }

    limit(count) {
      this.limitCount = count;
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    async then(onfulfilled) {
      try {
        let data = getMockTable(this.tableName);

        // Apply eq filters
        let filtered = data.filter(item => this.filters.every(f => f(item)));

        // Apply or text filters (for search)
        if (this.orFilterString) {
          // e.g., 'title.ilike.%test%,content.ilike.%test%'
          const conditions = this.orFilterString.split(',');
          filtered = filtered.filter(item => {
            return conditions.some(cond => {
              const [col, op, pattern] = cond.split('.');
              const term = pattern ? pattern.replace(/%/g, '').toLowerCase() : '';
              const val = String(item[col] || '').toLowerCase();
              return val.includes(term);
            });
          });
        }

        // Apply ordering
        if (this.orderCol) {
          filtered.sort((a, b) => {
            const valA = a[this.orderCol];
            const valB = b[this.orderCol];
            if (valA === undefined) return 1;
            if (valB === undefined) return -1;
            if (typeof valA === 'string') {
              return this.orderAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return this.orderAsc ? valA - valB : valB - valA;
          });
        }

        // Apply limit
        if (this.limitCount !== null) {
          filtered = filtered.slice(0, this.limitCount);
        }

        let result;
        if (this.isSingle) {
          result = { data: filtered[0] || null, error: filtered.length ? null : { message: 'Row not found' } };
        } else {
          result = { data: filtered, error: null };
        }
        return onfulfilled(result);
      } catch (err) {
        console.error(err);
        return onfulfilled({ data: null, error: { message: err.message } });
      }
    }

    async insert(rows) {
      try {
        const data = getMockTable(this.tableName);
        const newRows = Array.isArray(rows) 
          ? rows.map(r => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r })) 
          : [{ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...rows }];
        
        const updated = [...data, ...newRows];
        saveMockTable(this.tableName, updated);
        
        // Auto publish trigger mimic for admin auto approvals or self posts
        if (this.tableName === 'submissions') {
          // If approved instantly (e.g. by admin panel)
          newRows.forEach(sub => {
            if (sub.status === 'approved') {
              const contentTable = sub.content_type === 'philosophy' ? 'philosophy_articles' : sub.content_type;
              const contentData = getMockTable(contentTable);
              contentData.push({
                id: crypto.randomUUID(),
                title: sub.title || '',
                content: sub.content,
                author: sub.author,
                category: sub.category,
                tags: sub.tags || [],
                status: 'approved',
                featured: false,
                views: 0,
                created_at: new Date().toISOString()
              });
              saveMockTable(contentTable, contentData);
            }
          });
        }

        return { data: newRows, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    }

    async update(changes) {
      try {
        const data = getMockTable(this.tableName);
        let updatedRows = [];
        const updated = data.map(item => {
          if (this.filters.every(f => f(item))) {
            const updatedItem = { ...item, ...changes };
            updatedRows.push(updatedItem);
            
            // Submissions transition to approved trigger mimic
            if (this.tableName === 'submissions' && changes.status === 'approved' && item.status !== 'approved') {
              const contentTable = updatedItem.content_type === 'philosophy' ? 'philosophy_articles' : updatedItem.content_type;
              const contentData = getMockTable(contentTable);
              contentData.push({
                id: crypto.randomUUID(),
                title: updatedItem.title || '',
                content: updatedItem.content,
                author: updatedItem.author,
                category: updatedItem.category,
                tags: updatedItem.tags || [],
                status: 'approved',
                featured: false,
                views: 0,
                created_at: new Date().toISOString()
              });
              saveMockTable(contentTable, contentData);
            }
            return updatedItem;
          }
          return item;
        });

        saveMockTable(this.tableName, updated);
        return { data: updatedRows, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    }

    async delete() {
      try {
        const data = getMockTable(this.tableName);
        const deletedRows = data.filter(item => this.filters.every(f => f(item)));
        const remaining = data.filter(item => !this.filters.every(f => f(item)));
        saveMockTable(this.tableName, remaining);
        return { data: deletedRows, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    }
  }

  // Set up mock auth system
  const mockAuth = {
    signUp: async ({ email, password, options }) => {
      const users = getMockTable('profiles');
      const emailLower = email.toLowerCase();
      if (users.some(u => u.email.toLowerCase() === emailLower)) {
        return { data: null, error: { message: 'User already exists.' } };
      }

      const username = options?.data?.username || email.split('@')[0];
      const newUser = {
        id: crypto.randomUUID(),
        username,
        email,
        profile_image: options?.data?.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        bio: options?.data?.bio || '',
        role: emailLower.includes('admin') ? 'admin' : 'user',
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      saveMockTable('profiles', users);

      const session = { access_token: 'mock-token', user: newUser };
      localStorage.setItem('mock_session', JSON.stringify(session));

      // Emit custom auth event
      window.dispatchEvent(new Event('mock-auth-change'));
      return { data: { user: newUser, session }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      const users = getMockTable('profiles');
      const emailLower = email.toLowerCase();
      const user = users.find(u => u.email.toLowerCase() === emailLower);

      if (!user) {
        return { data: null, error: { message: 'Invalid login credentials' } };
      }

      const session = { access_token: 'mock-token', user };
      localStorage.setItem('mock_session', JSON.stringify(session));
      
      window.dispatchEvent(new Event('mock-auth-change'));
      return { data: { user, session }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('mock_session');
      window.dispatchEvent(new Event('mock-auth-change'));
      return { error: null };
    },

    getUser: async () => {
      const sessionStr = localStorage.getItem('mock_session');
      if (!sessionStr) return { data: { user: null }, error: null };
      
      const session = JSON.parse(sessionStr);
      // reload profile details in case of update
      const profiles = getMockTable('profiles');
      const user = profiles.find(p => p.id === session.user.id) || session.user;
      return { data: { user }, error: null };
    },

    getSession: async () => {
      const sessionStr = localStorage.getItem('mock_session');
      if (!sessionStr) return { data: { session: null }, error: null };
      return { data: { session: JSON.parse(sessionStr) }, error: null };
    },

    updateUser: async ({ data: metaData }) => {
      const sessionStr = localStorage.getItem('mock_session');
      if (!sessionStr) return { data: null, error: { message: 'No active session' } };
      
      const session = JSON.parse(sessionStr);
      const profiles = getMockTable('profiles');
      
      const updatedProfiles = profiles.map(p => {
        if (p.id === session.user.id) {
          return {
            ...p,
            username: metaData.username || p.username,
            bio: metaData.bio !== undefined ? metaData.bio : p.bio,
            profile_image: metaData.profile_image || p.profile_image
          };
        }
        return p;
      });

      saveMockTable('profiles', updatedProfiles);
      const updatedUser = updatedProfiles.find(p => p.id === session.user.id);
      session.user = updatedUser;
      localStorage.setItem('mock_session', JSON.stringify(session));

      window.dispatchEvent(new Event('mock-auth-change'));
      return { data: { user: updatedUser }, error: null };
    },

    onAuthStateChange: (callback) => {
      const handler = () => {
        const sessionStr = localStorage.getItem('mock_session');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      };
      
      window.addEventListener('mock-auth-change', handler);
      // Run immediately
      const sessionStr = localStorage.getItem('mock_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => window.removeEventListener('mock-auth-change', handler)
          }
        }
      };
    }
  };

  const mockStorage = {
    from: (bucket) => ({
      upload: async (path, file) => {
        // Return a mock object URL for uploaded images
        const url = URL.createObjectURL(file);
        return { data: { path, url }, error: null };
      },
      getPublicUrl: (path) => {
        // Fallback placeholder images based on path keywords
        if (path.includes('profile')) {
          return { data: { publicUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${path}` } };
        }
        return { data: { publicUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600' } };
      }
    })
  };

  // Mock Supabase Object
  supabase = {
    auth: mockAuth,
    storage: mockStorage,
    from: (tableName) => new MockQueryBuilder(tableName)
  };
}

export { supabase, isSupabaseConfigured };
