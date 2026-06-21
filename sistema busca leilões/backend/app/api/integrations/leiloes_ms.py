import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import re

WEBHOOK_N8N = "https://n8n.douradosap.com.br/webhook/531322fb-763e-496c-846e-364aa8de1331" 
URL_BUSCA = "https://www.leiloesonlinems.com.br/busca.aspx?p=sucata"
PREFIXO_SITE = "https://www.leiloesonlinems.com.br"

def extrair_dados_leiloes_ms():
    print("Iniciando varredura no Leilões MS...")
    headers = {"User-Agent": "Mozilla/5.0"}
    
    try:
        response = requests.get(URL_BUSCA, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")
        
        links_unicos = set()
        for link in soup.find_all("a", href=True):
            if "/lote/" in link["href"]:
                links_unicos.add(link["href"])
                
        palavras_ignoradas = ["MOTOCICLETA", "MOTOCICLETAS", "MOTO ", "MOTONETA", "HONDA", "YAMAHA", "SUZUKI"]
        veiculos_encontrados = []
        
        for href_lote in links_unicos:
            partes_url = href_lote.split("/")
            if len(partes_url) < 3: continue
                
            slug_carro = partes_url[-2]
            titulo_limpo = slug_carro.replace("-", " ").upper()
            
            if any(palavra in titulo_limpo for palavra in palavras_ignoradas): continue
            
            link_completo = PREFIXO_SITE + href_lote if href_lote.startswith("/") else href_lote
            str_lote = partes_url[-3]
            numero_lote = str_lote.replace("lote-", "") if "lote-" in str_lote else "000"
            
            tipo_sucata = "inservivel" if "INSERVIVEL" in titulo_limpo or "INSERVÍVEL" in titulo_limpo else "aproveitavel"
                
            image_url = ""
            data_encerramento = None
            
            try:
                time.sleep(0.5) 
                res_detalhes = requests.get(link_completo, headers=headers)
                soup_detalhes = BeautifulSoup(res_detalhes.text, "html.parser")
                
                for img in soup_detalhes.find_all("img"):
                    src = img.get("src", "")
                    if ".jpg" in src.lower() or ".jpeg" in src.lower():
                        image_url = PREFIXO_SITE + src if src.startswith("/") else src
                        break
                
                texto_pagina = soup_detalhes.get_text()
                match_data = re.search(r'Encerramento:\s*(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})', texto_pagina)
                if match_data:
                    data_str = match_data.group(1)
                    data_obj = datetime.strptime(data_str, "%d/%m/%Y %H:%M")
                    data_encerramento = data_obj.isoformat() + "Z"
                    
            except Exception as e:
                print(f"Erro ao ler detalhes do lote {numero_lote}: {e}")
                
            veiculos_encontrados.append({
                "numero_lote": numero_lote,
                "veiculo_origem": titulo_limpo,
                "link_leilao": link_completo,
                "tipo_sucata": tipo_sucata,
                "image_url": image_url,
                "auction_end_at": data_encerramento
            })
            
        if veiculos_encontrados:
            requests.post(WEBHOOK_N8N, json={"lotes": veiculos_encontrados})
            return {"status": "success", "message": f"{len(veiculos_encontrados)} lotes enviados para o n8n!"}
        
        return {"status": "warning", "message": "Nenhum carro encontrado."}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
