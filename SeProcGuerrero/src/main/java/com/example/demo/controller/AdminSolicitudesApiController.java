package com.example.demo.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.SolicitudDetalleDto;
import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Proyecto;
import com.example.demo.repository.ProyectoRepository;
import com.example.demo.repository.SolicitudProyectoRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.ProyectoEtapaService;
import com.example.demo.service.SeguridadService;

@RestController
@RequestMapping("/api/admin/solicitudes")
public class AdminSolicitudesApiController {

	private final SolicitudProyectoRepository solRepo;
	private final UsuarioRepository usuarioRepo;
	private final ProyectoRepository proyectoRepo;
	private final ProyectoEtapaService proyectoEtapaService;
	private final SeguridadService seguridadService;


	public AdminSolicitudesApiController(SolicitudProyectoRepository solRepo, UsuarioRepository usuarioRepo,
			ProyectoRepository proyectoRepo, ProyectoEtapaService proyectoEtapaService, SeguridadService seguridadService) {
				
		this.solRepo = solRepo;
		this.usuarioRepo = usuarioRepo;
		this.proyectoRepo = proyectoRepo;
		this.proyectoEtapaService = proyectoEtapaService;
		this.seguridadService = seguridadService;
	}

	@GetMapping
	public ResponseEntity<?> listar(@RequestParam("estado") String estado) {
        // Solo pasamos el estado. Hibernate inyecta el Tenant por detrás.
		var items = solRepo
			.findByEstadoSolicitudOrderByFechaSolicitudDesc(estado.toUpperCase())
			.stream()
			.map(s -> {
				var u = usuarioRepo.findById(s.getIdUsuarioContratista()).orElse(null);

				return new HashMap<String, Object>() {
					{
						put("idSolicitud", s.getIdSolicitud());
						put("nombreEscuela", s.getNombreEscuela());
						put("constructor", u != null ? (u.getNombre() + " " + u.getApellido()) : "—");
						put("fechaSolicitud", s.getFechaSolicitud() != null
								? s.getFechaSolicitud().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "");
						put("estadoSolicitud", s.getEstadoSolicitud());
					}
				};
			})
			.toList();

		return ResponseEntity.ok(items);
	}

	@GetMapping("/{id}")
	public ResponseEntity<?> detalle(@PathVariable Integer id) {
		var solOpt = solRepo.findById(id);
		if (solOpt.isEmpty())
			return ResponseEntity.notFound().build();

		var s = solOpt.get();

		SolicitudDetalleDto dto = new SolicitudDetalleDto();
		dto.idSolicitud = s.getIdSolicitud();
		dto.estadoSolicitud = s.getEstadoSolicitud();
		dto.motivoRechazo = s.getMotivoRechazo();
		dto.fechaSolicitud = s.getFechaSolicitud() != null
				? s.getFechaSolicitud().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : null;

		var uEnv = usuarioRepo.findById(s.getIdUsuarioContratista()).orElse(null);
		dto.quienEnvia = (uEnv != null) ? (uEnv.getNombre() + " " + uEnv.getApellido()) : "—";

		dto.nombreEscuela = s.getNombreEscuela();
		dto.cct1 = s.getCct1();
		dto.cct2 = s.getCct2();
		dto.estado = s.getEstado() != null ? s.getEstado().getNombre() : "";
		dto.municipio = s.getMunicipio() != null ? s.getMunicipio().getNombre() : "";
		dto.ciudad = s.getLocalidad() != null ? s.getLocalidad().getNombre() : "";
		dto.calleNumero = s.getCalleNumero();
		dto.cp = s.getCp();
		dto.responsableInmueble = s.getResponsableInmueble();
		dto.contacto = s.getContacto();
		dto.numInmueblesEvaluar = s.getNumInmueblesEvaluar();
		dto.numEntreEjes = s.getNumEntreEjes();
		dto.tipoObra = s.getTipoObra();
		dto.tipoEdificacion = s.getTipoEdificacion() != null ? s.getTipoEdificacion().getNombre() : "";
		
		var p = proyectoRepo.findBySolicitud_IdSolicitud(id).orElse(null);
		if (p != null && p.getIdUsuarioSupervisor() != null) {
			var sup = usuarioRepo.findById(p.getIdUsuarioSupervisor()).orElse(null);
			dto.supervisorAsignado = sup != null ? (sup.getNombre() + " " + sup.getApellido()) : "—";
		}
		else {
			dto.supervisorAsignado = null;
		}

		return ResponseEntity.ok(dto);
	}

	@GetMapping("/supervisores")
	public ResponseEntity<?> supervisores() {
		
		Institucion miInstitucion = seguridadService.getInstitucionActual();
		var list = usuarioRepo.findByInstitucionAndRol_NombreIgnoreCase(miInstitucion, "supervisor")
			.stream()
			.map(u -> new HashMap<String, Object>() {
				{
					put("id", u.getIdUsuario());
					put("nombre", u.getNombre() + " " + u.getApellido());
				}
			})
			.toList();

		return ResponseEntity.ok(list);
	}

	@PostMapping("/{id}/aprobar")
	public ResponseEntity<?> aprobar(@PathVariable Integer id, @RequestParam Long supervisorId, Authentication auth) {
		var solOpt = solRepo.findById(id);
		if (solOpt.isEmpty())
			return ResponseEntity.notFound().build();

		var s = solOpt.get();


		if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
			return ResponseEntity.badRequest().body("Solo se puede aprobar si está PENDIENTE");
		}

		if (proyectoRepo.existsBySolicitud_IdSolicitud(id)) {
			return ResponseEntity.badRequest().body("Ya existe un proyecto para esta solicitud");
		}

		var admin = usuarioRepo.findByUsername(auth.getName()).orElse(null);
		if (admin == null)
			return ResponseEntity.badRequest().body("Administrador no encontrado");

		s.setEstadoSolicitud("APROBADA");
		s.setIdUsuarioCentral(admin.getIdUsuario());
		s.setMotivoRechazo(null);
		s.setFechaResolucion(LocalDateTime.now());
		solRepo.save(s);

		Proyecto p = new Proyecto();
		p.setSolicitud(s);
		p.setIdUsuarioSupervisor(supervisorId);
		p.setEstadoProyecto("ACTIVO");

		Proyecto proyectoGuardado = proyectoRepo.save(p);
		proyectoEtapaService.inicializarEtapasProyecto(proyectoGuardado);

		return ResponseEntity.ok("OK");
	}

	@PostMapping("/{id}/rechazar")
	public ResponseEntity<?> rechazar(@PathVariable Integer id, @RequestParam String motivo, Authentication auth) {
		if (motivo == null || motivo.trim().isEmpty()) {
			return ResponseEntity.badRequest().body("Motivo requerido");
		}

		var solOpt = solRepo.findById(id);
		if (solOpt.isEmpty())
			return ResponseEntity.notFound().build();

		var s = solOpt.get();


		if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
			return ResponseEntity.badRequest().body("Solo se puede rechazar si está PENDIENTE");
		}

		var admin = usuarioRepo.findByUsername(auth.getName()).orElse(null);
		if (admin == null)
			return ResponseEntity.badRequest().body("Administrador no encontrado");

		s.setEstadoSolicitud("RECHAZADA");
		s.setIdUsuarioCentral(admin.getIdUsuario());
		s.setMotivoRechazo(motivo.trim());
		s.setFechaResolucion(LocalDateTime.now());
		solRepo.save(s);

		return ResponseEntity.ok("OK");
	}

}
