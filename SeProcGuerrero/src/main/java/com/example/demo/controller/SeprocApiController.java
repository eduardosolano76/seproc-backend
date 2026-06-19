package com.example.demo.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.demo.modelo.SolicitudInstitucion;
import com.example.demo.repository.InstitucionRepository;
import com.example.demo.repository.SolicitudInstitucionRepository;

@RestController
@RequestMapping("/api/seproc")
public class SeprocApiController {

    @Autowired
    private SolicitudInstitucionRepository solicitudRepository;

    @Autowired
    private InstitucionRepository institucionRepo;

    @GetMapping("/instituciones")
    public Object obtenerInstituciones() {
        return institucionRepo.findByActiva(1);
    }

    @PostMapping("/solicitudes")
    public Map<String, String> guardarSolicitud(@RequestBody SolicitudInstitucion solicitud) {

        solicitudRepository.save(solicitud);

        return Map.of(
            "mensaje",
            "¡Tu solicitud ha sido enviada correctamente! El equipo de SeProc se pondrá en contacto pronto."
        );
    }
}