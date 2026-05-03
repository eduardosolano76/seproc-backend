package com.example.demo.controller;

import com.example.demo.dto.OptionDto;
import com.example.demo.repository.TipoEdificacionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos")
public class CatalogoSolicitudApiController {

	private final TipoEdificacionRepository tipoEdificacionRepository;

	public CatalogoSolicitudApiController(TipoEdificacionRepository tipoEdificacionRepository) {
		this.tipoEdificacionRepository = tipoEdificacionRepository;
	}

	@GetMapping("/tipos-edificacion")
	public List<OptionDto> tiposEdificacion() {
		return tipoEdificacionRepository.findByActivoTrueOrderByNombreAsc()
			.stream()
			.map(t -> new OptionDto(t.getIdTipoEdificacion(), t.getNombre()))
			.toList();
	}

}