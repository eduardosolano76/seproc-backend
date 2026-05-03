package com.example.demo.controller;

import com.example.demo.dto.SolicitudProyectoRequest;
import com.example.demo.modelo.CatEstado;
import com.example.demo.modelo.CatLocalidad;
import com.example.demo.modelo.CatMunicipio;
import com.example.demo.modelo.SolicitudProyecto;
import com.example.demo.modelo.TipoEdificacion;
import com.example.demo.repository.CatEstadoRepository;
import com.example.demo.repository.CatLocalidadRepository;
import com.example.demo.repository.CatMunicipioRepository;
import com.example.demo.repository.SolicitudProyectoRepository;
import com.example.demo.repository.TipoEdificacionRepository;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/constructor")
public class ConstructorSolicitudController {

	private final SolicitudProyectoRepository solRepo;

	private final CatEstadoRepository estadoRepo;

	private final CatMunicipioRepository municipioRepo;

	private final CatLocalidadRepository localidadRepo;

	private final TipoEdificacionRepository tipoEdificacionRepo;

	private final UsuarioRepository usuarioRepo;

	public ConstructorSolicitudController(SolicitudProyectoRepository solRepo, CatEstadoRepository estadoRepo,
			CatMunicipioRepository municipioRepo, CatLocalidadRepository localidadRepo,
			TipoEdificacionRepository tipoEdificacionRepo, UsuarioRepository usuarioRepo) {
		this.solRepo = solRepo;
		this.estadoRepo = estadoRepo;
		this.municipioRepo = municipioRepo;
		this.localidadRepo = localidadRepo;
		this.tipoEdificacionRepo = tipoEdificacionRepo;
		this.usuarioRepo = usuarioRepo;
	}

	@PostMapping("/solicitudes")
	public ResponseEntity<?> crearSolicitud(@RequestBody SolicitudProyectoRequest req, Authentication auth) {

		String username = auth.getName();
		var usuario = usuarioRepo.findByUsername(username);
		if (usuario.isEmpty()) {
			return ResponseEntity.badRequest().body("Usuario no encontrado");
		}

		CatEstado estado = estadoRepo.findById(req.idEstado).orElse(null);
		CatMunicipio municipio = municipioRepo.findById(req.idMunicipio).orElse(null);
		CatLocalidad localidad = localidadRepo.findById(req.idLocalidad).orElse(null);
		TipoEdificacion tipoEdificacion = req.idTipoEdificacion != null
				? tipoEdificacionRepo.findById(req.idTipoEdificacion).orElse(null) : null;

		if (estado == null || municipio == null || localidad == null) {
			return ResponseEntity.badRequest().body("Ubicación inválida");
		}

		if (tipoEdificacion == null) {
			return ResponseEntity.badRequest().body("Tipo de edificación inválido");
		}

		SolicitudProyecto s = new SolicitudProyecto();
		s.setIdUsuarioContratista(usuario.get().getIdUsuario());
		s.setEstadoSolicitud("PENDIENTE");

		s.setNombreEscuela(req.nombreEscuela);
		s.setCct1(req.cct1);
		s.setCct2((req.cct2 == null || req.cct2.isBlank()) ? null : req.cct2);

		s.setEstado(estado);
		s.setMunicipio(municipio);
		s.setLocalidad(localidad);
		s.setTipoEdificacion(tipoEdificacion);

		s.setCalleNumero(req.calleNumero);
		s.setCp(req.cp);

		s.setResponsableInmueble(req.responsable);
		s.setContacto(req.contacto);

		s.setNumInmueblesEvaluar(req.numInmuebles);
		s.setNumEntreEjes(req.numEntreEjes);

		s.setTipoObra(req.tipoObra);

		solRepo.save(s);

		return ResponseEntity.ok().body("OK");
	}

}