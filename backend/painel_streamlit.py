"""Painel alternativo em Streamlit para teste da API de IA Generativa.

Executar com:
    pip install streamlit
    streamlit run backend/painel_streamlit.py
"""
import time
import requests

try:
    import streamlit as st
except ImportError:
    print("Streamlit não está instalado. Instale com: pip install streamlit")
    exit(0)

st.set_page_config(page_title="Contextual Clicker — Painel IA", layout="wide")
st.title("⛏️ Contextual Clicker — Painel de Testes da API")
st.caption("Disciplina: Front-End & NLP — Teste de rotas, providers e autenticação FastAPI")

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("Configurações da Requisição")
    api_url = st.text_input("URL Base da API", "http://127.0.0.1:8000")
    api_key = st.text_input("X-API-Key (Header de Autenticação)", "cc-dev-key-troque-me")
    tipo = st.selectbox(
        "Modalidade / Tipo",
        ["universo", "picareta", "buff", "artefato", "epilogo"],
        index=0
    )
    tema = st.text_input("Tema do Universo", "Cozinha")
    
    contexto = {}
    if tipo == "picareta":
        nivel = st.slider("Nível da Picareta", 1, 7, 2)
        contexto = {"nivel": nivel, "poder_clique": nivel * 2, "por_segundo": nivel}
    elif tipo == "buff":
        mult = st.slider("Multiplicador", 2, 5, 2)
        dur = st.slider("Duração (s)", 10, 60, 30)
        contexto = {"multiplicador": mult, "duracao": dur}
    elif tipo == "artefato":
        raridade = st.slider("Raridade", 1, 5, 3)
        numero = st.number_input("Número do Artefato", 1, 8, 1)
        contexto = {"raridade": raridade, "numero": numero}
    elif tipo == "epilogo":
        contexto = {"estatisticas": {"tempo": "03:12", "cliques": 140, "pedras": 3500}}

    enviar = st.button("Enviar POST /v1/ia-generativa/texto")

with col2:
    st.subheader("Resposta do Servidor FastAPI")
    if enviar:
        headers = {"X-API-Key": api_key, "Content-Type": "application/json"}
        payload = {"tipo": tipo, "tema": tema, "contexto": contexto}
        
        inicio = time.time()
        try:
            resp = requests.post(
                f"{api_url}/v1/ia-generativa/texto",
                headers=headers,
                json=payload,
                timeout=90
            )
            latencia = round((time.time() - inicio) * 1000)
            
            st.metric("Status HTTP", f"{resp.status_code} {resp.reason}", f"{latencia} ms")
            if resp.status_code == 200:
                dados = resp.json()
                st.success(f"Fonte: {dados.get('fonte')} | Modelo: {dados.get('modelo')}")
                st.json(dados)
            elif resp.status_code == 401:
                st.error("401 Unauthorized: Chave de autenticação inválida ou ausente!")
                st.json(resp.json())
            else:
                st.warning(f"Erro {resp.status_code}")
                st.json(resp.json())
        except Exception as e:
            st.error(f"Erro ao conectar com a API: {e}")
