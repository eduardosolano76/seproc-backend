package com.example.demo.controller;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Proyecto;
import com.example.demo.modelo.ProyectoEtapa;
import com.example.demo.modelo.SolicitudProyecto;
import com.example.demo.repository.ProyectoRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.ProyectoEtapaService;
import com.example.demo.service.SeguridadService;

@RestController
@RequestMapping("/api/supervisor/proyectos")
public class SupervisorProyectosApiController {

	private final ProyectoRepository proyectoRepo;
	private final UsuarioRepository usuarioRepo;
	private final ProyectoEtapaService proyectoEtapaService;
	private final SeguridadService seguridadService;

	public SupervisorProyectosApiController(ProyectoRepository proyectoRepo, UsuarioRepository usuarioRepo,
			ProyectoEtapaService proyectoEtapaService, SeguridadService seguridadService) {
		this.proyectoRepo = proyectoRepo;
		this.usuarioRepo = usuarioRepo;
		this.proyectoEtapaService = proyectoEtapaService;
		this.seguridadService = seguridadService;
	}

	@GetMapping
	public ResponseEntity<?> listar(@RequestParam("estado") String estado, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Supervisor no encontrado");
		}

		Long supervisorId = usuarioOpt.get().getIdUsuario();
		Institucion miInstitucion = seguridadService.getInstitucionActual();

		var items = proyectoRepo
				.findByInstitucionAndIdUsuarioSupervisorAndEstadoProyectoOrderByFechaAprobacionDesc(miInstitucion,
						supervisorId, estado.toUpperCase())
				.stream().map(p -> {
					SolicitudProyecto s = p.getSolicitud();
					var constructor = usuarioRepo.findById(s.getIdUsuarioContratista()).orElse(null);

					return new HashMap<String, Object>() {
						{
							put("idProyecto", p.getIdProyecto());
							put("idSolicitud", s.getIdSolicitud());
							put("nombreEscuela", s.getNombreEscuela());
							put("constructor",
									constructor != null ? (constructor.getNombre() + " " + constructor.getApellido())
											: "—");
							put("fechaAprobacion", p.getFechaAprobacion() != null
									? p.getFechaAprobacion().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
									: "");
							put("estadoProyecto", p.getEstadoProyecto());
						}
					};
				}).toList();

		return ResponseEntity.ok(items);
	}

	@GetMapping("/{id}")
	public ResponseEntity<?> detalle(@PathVariable Integer id, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Supervisor no encontrado");
		}

		Long supervisorId = usuarioOpt.get().getIdUsuario();
		Institucion miInstitucion = seguridadService.getInstitucionActual();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();

		if (!supervisorId.equals(p.getIdUsuarioSupervisor())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto");
		}

		if (!p.getInstitucion().getIdInstitucion().equals(miInstitucion.getIdInstitucion())
				|| !supervisorId.equals(p.getIdUsuarioSupervisor())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto");
		}

		SolicitudProyecto s = p.getSolicitud();

		var constructor = usuarioRepo.findById(s.getIdUsuarioContratista()).orElse(null);
		var supervisor = usuarioRepo.findById(p.getIdUsuarioSupervisor()).orElse(null);

		var dto = new HashMap<String, Object>();
		dto.put("idProyecto", p.getIdProyecto());
		dto.put("idSolicitud", s.getIdSolicitud());
		dto.put("estadoProyecto", p.getEstadoProyecto());
		dto.put("fechaAprobacion",
				p.getFechaAprobacion() != null
						? p.getFechaAprobacion().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
						: null);

		dto.put("quienEnvia", constructor != null ? (constructor.getNombre() + " " + constructor.getApellido()) : "—");

		dto.put("supervisorAsignado",
				supervisor != null ? (supervisor.getNombre() + " " + supervisor.getApellido()) : "—");

		dto.put("nombreEscuela", s.getNombreEscuela());
		dto.put("estado", s.getEstado().getNombre());
		dto.put("municipio", s.getMunicipio().getNombre());
		dto.put("ciudad", s.getLocalidad().getNombre());
		dto.put("tipoObra", s.getTipoObra());
		dto.put("tipoEdificacion", s.getTipoEdificacion() != null ? s.getTipoEdificacion().getNombre() : "");
		dto.put("modoVista", "SUPERVISOR");
		dto.put("soloLectura", false);
		dto.put("puedeSubir", false);
		dto.put("puedeComentar", true);
		dto.put("puedeAprobar", true);
		dto.put("estadosEtapa", proyectoEtapaService.obtenerEstadosVisuales(id));

		return ResponseEntity.ok(dto);
	}

	@PostMapping("/{id}/etapas/{etapa}/observar")
	public ResponseEntity<?> observarEtapa(@PathVariable Integer id, @PathVariable String etapa,
			@RequestParam("comentario") String comentario, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Supervisor no encontrado");
		}

		var supervisor = usuarioOpt.get();
		Long supervisorId = supervisor.getIdUsuario();
		Institucion miInstitucion = seguridadService.getInstitucionActual();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		Proyecto p = pOpt.get();
		if (!p.getInstitucion().getIdInstitucion().equals(miInstitucion.getIdInstitucion())
				|| !supervisorId.equals(p.getIdUsuarioSupervisor())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto");
		}

		ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
		proyectoEtapaService.registrarObservacion(etapaActual, supervisor, comentario);

		return ResponseEntity.ok("Observación registrada");
	}

	@PostMapping("/{id}/etapas/{etapa}/aprobar")
	public ResponseEntity<?> aprobarEtapa(@PathVariable Integer id, @PathVariable String etapa, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Supervisor no encontrado");
		}

		var supervisor = usuarioOpt.get();
		Long supervisorId = supervisor.getIdUsuario();
		Institucion miInstitucion = seguridadService.getInstitucionActual();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		Proyecto p = pOpt.get();
		if (!p.getInstitucion().getIdInstitucion().equals(miInstitucion.getIdInstitucion())
				|| !supervisorId.equals(p.getIdUsuarioSupervisor())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto");
		}

		ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
		proyectoEtapaService.aprobarEtapaYHabilitarSiguiente(etapaActual, supervisor);

		return ResponseEntity.ok("Etapa aprobada");
	}

	@GetMapping("/{id}/etapas/{etapa}")
	public ResponseEntity<?> detalleEtapa(@PathVariable Integer id, @PathVariable String etapa, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Supervisor no encontrado");
		}

		Long supervisorId = usuarioOpt.get().getIdUsuario();
		Institucion miInstitucion = seguridadService.getInstitucionActual();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();
		if (!p.getInstitucion().getIdInstitucion().equals(miInstitucion.getIdInstitucion())
				|| !supervisorId.equals(p.getIdUsuarioSupervisor())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto");
		}

		ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);

		// Obtenemos el detalle original
		@SuppressWarnings("unchecked")
		Map<String, Object> detalle = (Map<String, Object>) proyectoEtapaService.obtenerDetalleActualEtapa(etapaActual);

		if (detalle.get("entregaActual") != null) {
			@SuppressWarnings("unchecked")
			Map<String, Object> entrega = (Map<String, Object>) detalle.get("entregaActual");
			if ("BORRADOR".equalsIgnoreCase(String.valueOf(entrega.get("estadoEntrega")))) {
				detalle.put("entregaActual", null); // El supervisor no ve nada
			}
		}

		return ResponseEntity.ok(detalle);
	}

	@GetMapping("/{id}/etapas/{etapa}/historial")
	public ResponseEntity<?> historialEtapa(@PathVariable Integer id, @PathVariable String etapa, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Supervisor no encontrado");
		}

		Long supervisorId = usuarioOpt.get().getIdUsuario();
		Institucion miInstitucion = seguridadService.getInstitucionActual();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();
		if (!p.getInstitucion().getIdInstitucion().equals(miInstitucion.getIdInstitucion())
				|| !supervisorId.equals(p.getIdUsuarioSupervisor())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto");
		}

		ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);

		// Obtenemos el historial completo
		List<Map<String, Object>> historial = proyectoEtapaService.obtenerHistorialEtapa(etapaActual);

		historial.removeIf(item -> "BORRADOR".equalsIgnoreCase(String.valueOf(item.get("tipo"))));

		return ResponseEntity.ok(historial);
	}
}