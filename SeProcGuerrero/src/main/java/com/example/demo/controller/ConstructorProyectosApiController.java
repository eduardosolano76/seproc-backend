package com.example.demo.controller;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.modelo.Proyecto;
import com.example.demo.modelo.ProyectoEtapa;
import com.example.demo.modelo.ProyectoEtapaEntrega;
import com.example.demo.modelo.SolicitudProyecto;
import com.example.demo.repository.ProyectoEtapaEntregaRepository;
import com.example.demo.repository.ProyectoEtapaRepository;
import com.example.demo.repository.ProyectoRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.ProyectoEtapaService;
import com.example.demo.storage.StorageService;

@RestController
@RequestMapping("/api/constructor/proyectos")
public class ConstructorProyectosApiController {

	private final ProyectoRepository proyectoRepo;

	private final UsuarioRepository usuarioRepo;

	private final StorageService storageService;

	private final ProyectoEtapaService proyectoEtapaService;


	
	public ConstructorProyectosApiController(ProyectoRepository proyectoRepo, UsuarioRepository usuarioRepo,
			StorageService storageService, ProyectoEtapaRepository proyectoEtapaRepo,
			ProyectoEtapaEntregaRepository entregaRepo, ProyectoEtapaService proyectoEtapaService) {
		this.proyectoRepo = proyectoRepo;
		this.usuarioRepo = usuarioRepo;
		this.storageService = storageService;
		this.proyectoEtapaService = proyectoEtapaService;
		
	}

	@GetMapping
	public ResponseEntity<?> listar(@RequestParam("estado") String estado, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Constructor no encontrado");
		}

		Long constructorId = usuarioOpt.get().getIdUsuario();

		var items = proyectoRepo
				.findBySolicitud_IdUsuarioContratistaAndEstadoProyectoOrderByFechaAprobacionDesc(constructorId,
						estado.toUpperCase())
				.stream().map(p -> {
					SolicitudProyecto s = p.getSolicitud();
					var supervisor = usuarioRepo.findById(p.getIdUsuarioSupervisor()).orElse(null);

					return new HashMap<String, Object>() {
						{
							put("idProyecto", p.getIdProyecto());
							put("idSolicitud", s.getIdSolicitud());
							put("nombreEscuela", s.getNombreEscuela());
							put("supervisor",
									supervisor != null ? (supervisor.getNombre() + " " + supervisor.getApellido())
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
			return ResponseEntity.badRequest().body("Constructor no encontrado");
		}

		Long constructorId = usuarioOpt.get().getIdUsuario();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();

		SolicitudProyecto s = p.getSolicitud();

		if (!constructorId.equals(s.getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto");
		}

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
		dto.put("modoVista", "CONSTRUCTOR");
		dto.put("soloLectura", false);
		dto.put("puedeSubir", true);
		dto.put("puedeComentar", false);
		dto.put("puedeAprobar", false);
		dto.put("estadosEtapa", proyectoEtapaService.obtenerEstadosVisuales(id));

		return ResponseEntity.ok(dto);
	}

	@PostMapping("/{id}/etapas/{etapa}/reporte")
	public ResponseEntity<?> subirReporteEtapa(@PathVariable Integer id, @PathVariable String etapa,
			@RequestParam("file") MultipartFile file, @RequestParam(value = "nota", required = false) String nota,
			Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		var usuario = usuarioOpt.get();

		// Validar que el proyecto le pertenece al constructor
		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();

		if (!usuario.getIdUsuario().equals(p.getSolicitud().getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto.");
		}

		try {

			String key = storageService.saveReporteImagen(usuario.getIdUsuario(), usuario.getUsername(), id, etapa,
					file);
			String publicUrl = storageService.publicUrl(key);

			ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
			proyectoEtapaService.validarSubidaPermitida(etapaActual);

			ProyectoEtapaEntrega borrador = proyectoEtapaService.guardarBorrador(etapaActual, usuario,
					file.getOriginalFilename(), key, publicUrl, nota);

			return ResponseEntity.ok(Map.of("mensaje",
					"Archivo subido como borrador correctamente. Recuerda presionar 'Entregar' para enviarlo al supervisor.",
					"url", publicUrl));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno al subir el reporte.");
		}
	}

	@PostMapping("/{id}/etapas/{etapa}/entregar")
	public ResponseEntity<?> entregarReporteEtapa(@PathVariable Integer id, @PathVariable String etapa,
			Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		var usuario = usuarioOpt.get();

		// Validar accesos
		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();

		// Validar que el proyecto le pertenece al constructor logueado
		if (!usuario.getIdUsuario().equals(p.getSolicitud().getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto.");
		}

		try {
			ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);

			proyectoEtapaService.confirmarEntregaAlSupervisor(etapaActual, usuario);

			return ResponseEntity.ok(Map.of("mensaje", "El reporte ha sido enviado al supervisor exitosamente."));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno al enviar el reporte.");
		}
	}

	@GetMapping("/{id}/etapas/{etapa}")
	public ResponseEntity<?> detalleEtapa(@PathVariable Integer id, @PathVariable String etapa, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Constructor no encontrado");
		}

		Long constructorId = usuarioOpt.get().getIdUsuario();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();

		if (!constructorId.equals(p.getSolicitud().getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto.");
		}

		ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
		return ResponseEntity.ok(proyectoEtapaService.obtenerDetalleActualEtapa(etapaActual));
	}

	@GetMapping("/{id}/etapas/{etapa}/historial")
	public ResponseEntity<?> historialEtapa(@PathVariable Integer id, @PathVariable String etapa, Authentication auth) {

		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.badRequest().body("Constructor no encontrado");
		}

		Long constructorId = usuarioOpt.get().getIdUsuario();

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();

		if (!constructorId.equals(p.getSolicitud().getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto.");
		}

		ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
		return ResponseEntity.ok(proyectoEtapaService.obtenerHistorialEtapa(etapaActual));
	}

	@DeleteMapping("/{id}/etapas/{etapa}/archivo")
	public ResponseEntity<?> eliminarArchivoEtapa(@PathVariable Integer id, @PathVariable String etapa,
			@RequestParam("storagePath") String storagePath, Authentication auth) {
		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();
		
		if (!usuarioOpt.get().getIdUsuario().equals(p.getSolicitud().getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto.");
		}
		
		try {
			ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
			proyectoEtapaService.eliminarArchivoDeBorrador(etapaActual, storagePath);
			storageService.deleteIfExists(storagePath);

			return ResponseEntity.ok(Map.of("mensaje", "Imagen eliminada correctamente."));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	@GetMapping("/{id}/etapas/{etapa}/pdf")
	public ResponseEntity<byte[]> descargarPdfAprobado(@PathVariable Integer id, @PathVariable String etapa,
			Authentication auth) {
		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		
		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty() || !usuarioOpt.get().getIdUsuario().equals(pOpt.get().getSolicitud().getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		try {
			byte[] pdfBytes = proyectoEtapaService.generarPdfDeImagenesAprobadas(id, etapa);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_PDF);

			headers.setContentDispositionFormData("attachment", "Reporte_Aprobado_" + etapa + ".pdf");

			return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PostMapping("/{id}/etapas/{etapa}/archivo/nota")
	public ResponseEntity<?> actualizarNotaArchivo(@PathVariable Integer id, @PathVariable String etapa,
			@RequestParam("storagePath") String storagePath, @RequestParam("nota") String nota, Authentication auth) {
		var usuarioOpt = usuarioRepo.findByUsername(auth.getName());
		if (usuarioOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		var pOpt = proyectoRepo.findById(id);
		if (pOpt.isEmpty())
			return ResponseEntity.notFound().build();

		Proyecto p = pOpt.get();
		
		if (!usuarioOpt.get().getIdUsuario().equals(p.getSolicitud().getIdUsuarioContratista())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes acceso a este proyecto.");
		}
		
		try {
			ProyectoEtapa etapaActual = proyectoEtapaService.obtenerEtapaPorClaveVisual(id, etapa);
			proyectoEtapaService.actualizarNotaDeBorrador(etapaActual, storagePath, nota);
			return ResponseEntity.ok(Map.of("mensaje", "Nota actualizada correctamente."));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

}