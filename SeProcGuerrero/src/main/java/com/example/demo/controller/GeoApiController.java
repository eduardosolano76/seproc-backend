package com.example.demo.controller;

import com.example.demo.dto.OptionDto;
import com.example.demo.repository.CatEstadoRepository;
import com.example.demo.repository.CatMunicipioRepository;
import com.example.demo.repository.CatLocalidadRepository;
import com.example.demo.repository.TipoEdificacionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/geo")
public class GeoApiController {

	private final CatEstadoRepository estadosRepo;

	private final CatMunicipioRepository municipiosRepo;

	private final CatLocalidadRepository localidadesRepo;

	private final TipoEdificacionRepository tipoEdificacionRepo;

	public GeoApiController(CatEstadoRepository estadosRepo, CatMunicipioRepository municipiosRepo,
			CatLocalidadRepository localidadesRepo, TipoEdificacionRepository tipoEdificacionRepo) {
		this.estadosRepo = estadosRepo;
		this.municipiosRepo = municipiosRepo;
		this.localidadesRepo = localidadesRepo;
		this.tipoEdificacionRepo = tipoEdificacionRepo;
	}

	@GetMapping("/estados")
	public List<OptionDto> estados() {
		return estadosRepo.findAll()
			.stream()
			.sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
			.map(e -> new OptionDto(e.getIdEstado(), e.getNombre()))
			.toList();
	}

	@GetMapping("/municipios")
	public List<OptionDto> municipios(@RequestParam("estadoId") Integer estadoId) {
		return municipiosRepo.findByEstado_IdEstadoOrderByNombreAsc(estadoId)
			.stream()
			.map(m -> new OptionDto(m.getIdMunicipio(), m.getNombre()))
			.toList();
	}

	@GetMapping("/localidades")
	public List<OptionDto> localidades(@RequestParam("municipioId") Integer municipioId) {
		return localidadesRepo.findByMunicipio_IdMunicipioOrderByNombreAsc(municipioId)
			.stream()
			.map(l -> new OptionDto(l.getIdLocalidad(), l.getNombre()))
			.toList();
	}

	@GetMapping("/tipos-edificacion")
	public List<OptionDto> tiposEdificacion() {
		return tipoEdificacionRepo.findByActivoTrueOrderByNombreAsc()
			.stream()
			.map(t -> new OptionDto(t.getIdTipoEdificacion(), t.getNombre()))
			.toList();
	}

}