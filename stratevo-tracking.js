/**
 * Stratevo Visitor Tracking v1.0 - OLV Internacional
 * Configure: substitua SEU_TENANT_ID_AQUI pelo Tenant ID da OLV no Stratevo One (Configurações).
 * Domínio registrado no Stratevo deve ser olvinternacional.com.br para validação.
 */
(function() {
  'use strict';

  const CONFIG = {
    TENANT_ID: '050053d8-1e6b-4d16-8fb9-9376e1d079f2',
    API_URL: 'https://trsybhuzfmxidieyfpzo.supabase.co/functions/v1/track-visitor',
    TIME_UPDATE_INTERVAL: 30000,
    HIGH_INTENT_PATTERNS: {
      pricing: /preco|pricing|planos|valores|orcamento|investimento/i,
      demo: /demo|demonstracao|agendar|trial|teste|reuniao/i,
      caseStudies: /case|cliente|sucesso|depoimento|resultado|portfolio/i,
      contact: /contato|fale-conosco|contact|whatsapp/i
    },
    DEBUG: false
  };

  const log = (...args) => CONFIG.DEBUG && console.log('[Stratevo]', ...args);

  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Stratevo', 2, 2);
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  }

  function getSession() {
    let session = sessionStorage.getItem('stratevo_session');
    if (!session) {
      session = generateSessionId();
      sessionStorage.setItem('stratevo_session', session);
    }
    return session;
  }

  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      term: params.get('utm_term'),
      content: params.get('utm_content')
    };
  }

  function getPageCategory() {
    const url = window.location.href.toLowerCase();
    const title = (document.title || '').toLowerCase();
    const combined = url + ' ' + title;
    if (CONFIG.HIGH_INTENT_PATTERNS.pricing.test(combined)) return 'pricing';
    if (CONFIG.HIGH_INTENT_PATTERNS.demo.test(combined)) return 'demo';
    if (CONFIG.HIGH_INTENT_PATTERNS.caseStudies.test(combined)) return 'case';
    if (CONFIG.HIGH_INTENT_PATTERNS.contact.test(combined)) return 'contact';
    return 'general';
  }

  async function sendEvent(eventType, data) {
    try {
      const payload = {
        tenant_id: CONFIG.TENANT_ID,
        session_id: getSession(),
        visitor_fingerprint: generateFingerprint(),
        event_type: eventType,
        page_url: window.location.href,
        page_title: document.title,
        page_category: getPageCategory(),
        referrer: document.referrer,
        utm_params: getUTMParams(),
        ...data
      };
      log('Sending event:', eventType, payload);
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const result = await response.json();
      log('Event sent:', result);
      return result;
    } catch (error) {
      log('Error sending event:', error);
      return null;
    }
  }

  let maxScrollDepth = 0;
  let scrollTimeout = null;
  function trackScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    const currentDepth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    if (currentDepth > maxScrollDepth) {
      maxScrollDepth = currentDepth;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function() {
        if (maxScrollDepth >= 25) sendEvent('scroll', { scroll_depth: maxScrollDepth });
      }, 5000);
    }
  }

  let pageStartTime = Date.now();
  function startTimeTracking() {
    setInterval(function() {
      sendEvent('time_update', { time_on_page: CONFIG.TIME_UPDATE_INTERVAL / 1000 });
    }, CONFIG.TIME_UPDATE_INTERVAL);
  }

  function trackForms() {
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (!form || form.tagName !== 'FORM') return;
      const formData = {};
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(function(input) {
        const name = input.name || input.id || '';
        const value = input.value;
        if (/email/i.test(name)) formData.email = value;
        else if (/name|nome/i.test(name)) formData.name = value;
        else if (/phone|telefone|celular|whatsapp/i.test(name)) formData.phone = value;
        else if (/company|empresa/i.test(name)) formData.company = value;
        else if (input.type !== 'password' && input.type !== 'hidden') formData[name] = value;
      });
      if (Object.keys(formData).length > 0) sendEvent('form_submit', { form_data: formData });
    }, true);
  }

  function trackClicks() {
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a, button');
      if (!target) return;
      const text = (target.textContent || '').toLowerCase();
      const href = (target.href || '').toLowerCase();
      if (/demo|demonstra|agendar|trial|teste|orcamento|preco|contato|whatsapp/i.test(text + href)) {
        sendEvent('high_intent_click', {
          element: target.tagName,
          text: (target.textContent || '').trim().substring(0, 50),
          href: target.href || null
        });
      }
    }, true);
  }

  function trackExit() {
    window.addEventListener('beforeunload', function() {
      const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
      sendEvent('exit', { time_on_page: timeOnPage, scroll_depth: maxScrollDepth });
    });
  }

  function init() {
    if (!CONFIG.TENANT_ID || CONFIG.TENANT_ID === 'SEU_TENANT_ID_AQUI') {
      if (CONFIG.DEBUG) console.warn('[Stratevo] TENANT_ID não configurado. Obtenha em Stratevo One > Configurações.');
      return;
    }
    log('Initializing tracking for tenant:', CONFIG.TENANT_ID);
    sendEvent('pageview');
    window.addEventListener('scroll', trackScroll, { passive: true });
    startTimeTracking();
    trackForms();
    trackClicks();
    trackExit();
    log('Tracking initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
