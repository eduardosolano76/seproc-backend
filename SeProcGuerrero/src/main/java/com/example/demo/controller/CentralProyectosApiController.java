package com.example.demo.controller;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;

import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/central/proyectos")
public class CentralProyectosApiController {

	private final ProyectoRepository proyectoRepo;

	private final UsuarioRepository usuarioRepo;

	private final ProyectoEtapaService proyectoEtapaService;

	private final SeguridadService seguridadService;

	public CentralProyectosApiController(ProyectoRepository proyectoRepo, UsuarioRepository usuarioRepo,
			ProyectoEtapaService proyectoEtapaService, SeguridadService seguridadService) {
		this.proyectoRepo = proyectoRepo;
		this.usuarioRepo = usuarioRepo;
		this.proyectoEtapaService = proyectoEtapaService;
		this.seguridadService = seguridadService;
	}

	@GetMapping
	public ResponseEntity<?> listar(@RequestParam("estado") String estado) {

		var items = proyectoRepo
			.findByEstadoProyectoOrderByFechaAprobacionDesc(estado.toUpperCase())
			.stream()
			.map(p -> {
				SolicitudProyecto s = p.getSolicitud();

				var contratista = usuarioRepo.findById(s.getIdUsuarioContratista()).orElse(null);
				var supervisor = usuarioRepo.findById(p.getIdUsuarioSupervisor()).orElse(null);

				return new HashMap<String, Object>() {
					{
						put("idProyecto", p.getIdProyecto());
						put("idSolicitud", s.getIdSolicitud());
						put("nombreEscuela", s.getNombreEscuela());
						put("constructor", contratista != null
								? (contratista.getNombre() + " " + contratista.getApellido()) : "—");
						put("supervisor",
								supervisor != null ? (supervisor.getNombre() + " " + supervisor.getApellido()) : "—");
						put("fechaAprobacion", p.getFechaAprobacion() != null
								? p.getFechaAprobacion().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "");
						put("estadoProyecto", p.getEstadoProyecto());
					}
				};
			})
			.toList();

		return ResponseEntity.ok(items);
	}

	@GetMapping("/{id}")
	public ResponseEntity<?> detalle(@PathVariable Integer id) {
		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();


		SolicitudProyecto s = p.getSolicitud();

		var contratista = usuarioRepo.findById(s.getIdUsuarioContratista()).orElse(null);
		var supervisor = usuarioRepo.findById(p.getIdUsuarioSupervisor()).orElse(null);

		var dto = new HashMap<String, Object>();
		dto.put("idProyecto", p.getIdProyecto());
		dto.put("idSolicitud", s.getIdSolicitud());
		dto.put("estadoProyecto", p.getEstadoProyecto());
		dto.put("fechaAprobacion", p.getFechaAprobacion() != null
				? p.getFechaAprobacion().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : null);

		dto.put("quienEnvia", contratista != null ? (contratista.getNombre() + " " + contratista.getApellido()) : "—");
		dto.put("supervisorAsignado",
				supervisor != null ? (supervisor.getNombre() + " " + supervisor.getApellido()) : "—");

		dto.put("nombreEscuela", s.getNombreEscuela());
		dto.put("cct1", s.getCct1());
		dto.put("cct2", s.getCct2());
		dto.put("estado", s.getEstado().getNombre());
		dto.put("municipio", s.getMunicipio().getNombre());
		dto.put("ciudad", s.getLocalidad().getNombre());
		dto.put("calleNumero", s.getCalleNumero());
		dto.put("cp", s.getCp());
		dto.put("responsableInmueble", s.getResponsableInmueble());
		dto.put("contacto", s.getContacto());
		dto.put("numInmueblesEvaluar", s.getNumInmueblesEvaluar());
		dto.put("numEntreEjes", s.getNumEntreEjes());
		dto.put("tipoObra", s.getTipoObra());
		dto.put("tipoEdificacion", s.getTipoEdificacion() != null ? s.getTipoEdificacion().getNombre() : "");

		dto.put("modoVista", "CENTRAL");
		dto.put("soloLectura", true);
		dto.put("puedeSubir", false);
		dto.put("puedeComentar", false);
		dto.put("puedeAprobar", false);

		dto.put("estadosEtapa", proyectoEtapaService.obtenerEstadosVisuales(id));

		return ResponseEntity.ok(dto);
	}

	@GetMapping("/{id}/etapas/{etapa}")
	public ResponseEntity<?> detalleEtapa(@PathVariable Integer id, @PathVariable String etapa) {
		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();


		try {
			ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
			return ResponseEntity.ok(proyectoEtapaService.obtenerDetalleActualEtapa(etapaActual));
		}
		catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	@GetMapping("/{id}/etapas/{etapa}/historial")
	public ResponseEntity<?> historialEtapa(@PathVariable Integer id, @PathVariable String etapa) {
		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();


		try {
			ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
			return ResponseEntity.ok(proyectoEtapaService.obtenerHistorialEtapa(etapaActual));
		}
		catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	@PostMapping("/{id}/estado")
	public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, @RequestParam String estado) {
		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();


		String nuevoEstado = estado == null ? "" : estado.trim().toUpperCase();
		if (!nuevoEstado.equals("ACTIVO") && !nuevoEstado.equals("INACTIVO") && !nuevoEstado.equals("FINALIZADO")) {
			return ResponseEntity.badRequest().body("Estado no válido.");
		}
		p.setEstadoProyecto(nuevoEstado);
		proyectoRepo.save(p);

		return ResponseEntity.ok(new HashMap<String, Object>() {
			{
				put("message", "Estado actualizado correctamente.");
			}
		});
	}
}