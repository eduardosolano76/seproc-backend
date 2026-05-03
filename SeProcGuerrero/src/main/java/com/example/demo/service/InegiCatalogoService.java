package com.example.demo.service;

import com.example.demo.dto.InegiLocalidadDto;
import com.example.demo.dto.InegiMunicipioDto;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

@Service
public class InegiCatalogoService {

	private final RestTemplate restTemplate;

	private final ObjectMapper objectMapper;

	public InegiCatalogoService() {
		this.restTemplate = new RestTemplate();
		this.objectMapper = new ObjectMapper();
	}

	public List<InegiMunicipioDto> obtenerMunicipiosDeGuerrero() {
		String url = "https://gaia.inegi.org.mx/wscatgeo/v2/mgem/12";
		return extraerLista(url, InegiMunicipioDto.class);
	}

	public List<InegiLocalidadDto> obtenerLocalidadesDeMunicipio(String cveMunicipio) {
		String url = "https://gaia.inegi.org.mx/wscatgeo/v2/localidades/12/" + cveMunicipio;
		return extraerLista(url, InegiLocalidadDto.class);
	}

	private <T> List<T> extraerLista(String url, Class<T> clazz) {
		try {
			String json = restTemplate.getForObject(url, String.class);

			if (json == null || json.isBlank()) {
				return List.of();
			}

			JsonNode root = objectMapper.readTree(json);
			JsonNode datos = root.get("datos");

			if (datos == null || !datos.isArray()) {
				return List.of();
			}

			List<T> resultado = new ArrayList<>();
			for (JsonNode item : datos) {
				resultado.add(objectMapper.treeToValue(item, clazz));
			}
			return resultado;

		}
		catch (Exception e) {
			throw new RuntimeException("Error al consumir INEGI: " + url, e);
		}
	}

}